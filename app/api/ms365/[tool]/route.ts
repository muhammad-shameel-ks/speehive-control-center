import { NextResponse, type NextRequest } from "next/server";
import { MS365_PANELS } from "@/lib/ms365-graph";
import { getServerMs365Config, refreshAccessToken } from "@/lib/ms365-oauth";
import { getSession, updateSession, type Ms365User } from "@/lib/session";

type Ctx = { params: Promise<{ tool: string }> };

const REFRESH_WINDOW_MS = 60_000;
const MAIL_PAGE_SIZE = 25;

type GraphMessage = {
  id?: string;
  subject?: string;
  from?: { emailAddress?: { address?: string; name?: string } };
  receivedDateTime?: string;
  bodyPreview?: string;
  body?: { contentType?: string; content?: string };
  isRead?: boolean;
  webLink?: string;
};

type GraphChatMessage = {
  from?: { user?: { displayName?: string; id?: string }; application?: { displayName?: string } };
  body?: { content?: string; contentType?: string };
  createdDateTime?: string;
  messageType?: string;
};

type GraphChat = {
  id?: string;
  chatType?: string;
  topic?: string;
  lastMessagePreview?: {
    body?: { content?: string };
    from?: { user?: { displayName?: string }; application?: { displayName?: string } };
    createdDateTime?: string;
  };
  members?: Array<{
    displayName?: string;
    userId?: string;
    email?: string;
  }>;
  messages?: GraphChatMessage[];
};

function formatMailAsText(data: unknown): string {
  const messages = (data as { value?: GraphMessage[] })?.value;
  if (!Array.isArray(messages) || messages.length === 0) {
    return "No recent emails found.";
  }
  return messages
    .map((m) => {
      const sender = m.from?.emailAddress?.name ?? m.from?.emailAddress?.address ?? "Unknown";
      const subject = m.subject ?? "(no subject)";
      const htmlContent = m.body?.content ?? "";
      const plainBody = htmlContent
        ? htmlContent.replace(/<[^>]*>/g, "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
        : (m.bodyPreview ?? "");
      const date = m.receivedDateTime
        ? new Date(m.receivedDateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "";
      const unread = m.isRead === false ? "**NEW** " : "";
      const linkLine = m.webLink ? `**Link:** ${m.webLink}\n` : "";
      const htmlLine = htmlContent ? `**HTML:** ${Buffer.from(htmlContent).toString("base64")}\n` : "";
      return `### ${unread}${subject}\n**From:** ${sender} · ${date}\n${linkLine}${htmlLine}\n${plainBody.slice(0, 300)}`;
    })
    .join("\n\n---\n\n");
}

function formatChatsAsText(data: unknown, currentUser?: Ms365User): string {
  const chats = (data as { value?: GraphChat[] })?.value;
  if (!Array.isArray(chats) || chats.length === 0) {
    return "No recent chats found.";
  }

  const myId = currentUser?.id;
  const myEmail = currentUser?.email;
  const myName = currentUser?.name;

  let fallbackEmail = myEmail;
  if (!fallbackEmail) {
    for (const c of chats) {
      const found = c.members?.find((m) => m.email && !m.email.includes("#"));
      if (found?.email) {
        fallbackEmail = found.email;
        break;
      }
    }
  }

  return chats
    .map((c) => {
      let topic: string;
      if (c.topic) {
        topic = c.topic;
      } else if (c.chatType === "oneOnOne" && c.members) {
        // For DMs, show the other person's name by filtering out the current user
        const otherPerson = c.members.find((m) => {
          if (myId && m.userId === myId) return false;
          if (fallbackEmail && m.email && m.email.toLowerCase() === fallbackEmail.toLowerCase()) return false;
          if (myName && m.displayName && m.displayName.toLowerCase() === myName.toLowerCase()) return false;
          return true;
        });
        topic = otherPerson?.displayName ?? "Direct Message";
      } else if (c.chatType === "oneOnOne") {
        topic = "Direct Message";
      } else {
        topic = "Group Chat";
      }

      const lastDate = c.lastMessagePreview?.createdDateTime
        ? new Date(c.lastMessagePreview.createdDateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "";

      const teamsLink = c.id ? `https://teams.microsoft.com/l/chat/${encodeURIComponent(c.id)}/0` : "";
      const linkLine = teamsLink ? `**Link:** ${teamsLink}\n` : "";

      // Build chat bubble lines from fetched messages (oldest first — API returns newest first)
      const messages = (c.messages ?? [])
        .filter((m) => m.messageType === "message" && m.from != null && m.body?.content)
        .reverse();

      const bubbleLines = messages.map((m) => {
        const senderName = m.from?.user?.displayName ?? m.from?.application?.displayName ?? "Unknown";
        const senderId = m.from?.user?.id ?? "";
        const isMe = (myId && senderId === myId) ||
          (myName && senderName.toLowerCase() === (myName ?? "").toLowerCase());
        const rawContent = m.body?.content ?? "";
        const text = m.body?.contentType === "html"
          ? rawContent.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
          : rawContent.replace(/\s+/g, " ").trim();
        const time = m.createdDateTime ?? "";
        const tag = isMe ? "SENT" : "RECV";
        // Use pipe separator to avoid colons-in-time breaking the parser
        return `BUBBLE|${tag}|${senderName}|${time}|${text}`;
      }).join("\n");

      // Fallback to lastMessagePreview if no messages fetched
      const fallbackSender = c.lastMessagePreview?.from?.user?.displayName ?? c.lastMessagePreview?.from?.application?.displayName ?? "";
      const fallbackText = (c.lastMessagePreview?.body?.content ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
      const fallbackLine = !bubbleLines && fallbackSender
        ? `BUBBLE|RECV|${fallbackSender}||${fallbackText.slice(0, 200)}`
        : "";

      const chatTypeTag = c.chatType ?? "unknown";
      const chatIdTag = c.id ?? "";
      return `### ${chatTypeTag}|${chatIdTag}|${topic} · ${lastDate}\n${linkLine}${bubbleLines || fallbackLine}`;
    })
    .join("\n\n---\n\n");
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { tool } = await ctx.params;

  if (!(tool in MS365_PANELS)) {
    return NextResponse.json(
      { error: `Unknown panel: ${tool}` },
      { status: 404 },
    );
  }

  const url = new URL(req.url);
  const skipParam = url.searchParams.get("skip");
  const skip =
    skipParam !== null ? Math.max(0, Number.parseInt(skipParam, 10) || 0) : 0;

  const config = getServerMs365Config();
  if (!config) {
    return NextResponse.json({ state: "unconfigured" });
  }

  const panel = MS365_PANELS[tool as keyof typeof MS365_PANELS];
  const { data } = await getSession();

  if (!data.ms365AccessToken) {
    return NextResponse.json({ state: "unauthorized" });
  }

  let accessToken = data.ms365AccessToken;
  const needsRefresh =
    !data.ms365ExpiresAt ||
    data.ms365ExpiresAt - Date.now() < REFRESH_WINDOW_MS;

  if (needsRefresh) {
    if (!data.ms365RefreshToken) {
      return NextResponse.json({
        state: "unauthorized",
        error: "Token expired and no refresh token. Please reconnect.",
      });
    }
    try {
      const refreshed = await refreshAccessToken(
        data.ms365RefreshToken,
        config,
      );
      accessToken = refreshed.accessToken;
      await updateSession({
        ms365AccessToken: refreshed.accessToken,
        ms365RefreshToken: refreshed.refreshToken,
        ms365ExpiresAt: refreshed.expiresAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({
        state: "unauthorized",
        error: `Token refresh failed: ${message}`,
      });
    }
  }

  try {
    const rawData = await panel.fetchFn(accessToken, { skip });

    let text: string;
    let messageCount: number | undefined;
    if (tool === "outlook-mail") {
      text = formatMailAsText(rawData);
      const value = (rawData as { value?: unknown[] })?.value;
      messageCount = Array.isArray(value) ? value.length : 0;
    } else if (tool === "teams-chat") {
      text = formatChatsAsText(rawData, data.ms365User);
    } else {
      text = JSON.stringify(rawData, null, 2);
    }

    // Wrap in MCP-compatible format for DashboardShell
    const result = { content: [{ type: "text" as const, text }] };
    const hasMore = tool === "outlook-mail"
      ? (messageCount ?? 0) === MAIL_PAGE_SIZE
      : false;
    return NextResponse.json({
      state: "connected",
      result,
      hasMore,
      messageCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ state: "error", error: message });
  }
}
