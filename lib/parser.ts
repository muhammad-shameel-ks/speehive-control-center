export function decodeHtml(str: string): string {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export interface ParsedEmail {
  id: string;
  sender: string;
  subject: string;
  date: string;
  preview: string;
  isUnread: boolean;
  raw: string;
  url?: string;
  html?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSent: boolean;
}

export interface ParsedChat {
  id: string;
  title: string;
  date: string;
  lastMessage: string;
  sender: string;
  raw: string;
  url?: string;
  messages?: ChatMessage[];
  chatType?: "oneOnOne" | "group" | "meeting" | "unknown";
  graphChatId?: string;
}

export function parseEmails(text: string | null): ParsedEmail[] {
  if (!text || text.trim() === "") return [];

  if (text.includes("---")) {
    const segments = text.split(/\n+---\n+/);
    const parsed: ParsedEmail[] = [];

    segments.forEach((seg, idx) => {
      const cleanSeg = seg.trim();
      if (!cleanSeg) return;

      const subjectMatch = cleanSeg.match(/^###\s*(?:\*\*NEW\*\*\s*)?(.*)$/m);
      const subject = subjectMatch ? subjectMatch[1].trim() : "No Subject";
      const isUnread = cleanSeg.includes("**NEW**");

      const fromMatch = cleanSeg.match(/\*\*From:\*\*\s*(.*?)·\s*(.*)$/m);
      const sender = fromMatch ? fromMatch[1].trim() : "Unknown Sender";
      const date = fromMatch ? fromMatch[2].trim() : "";

      const lines = cleanSeg.split("\n");
      const fromLineIdx = lines.findIndex(l => l.includes("**From:**"));
      const bodyLines = fromLineIdx !== -1 ? lines.slice(fromLineIdx + 1) : lines;

      const linkMatch = bodyLines.find(l => l.startsWith("**Link:**"))?.match(/\*\*Link:\*\*\s*(https?:\/\/\S+)/);
      const url = linkMatch?.[1];
      const htmlMatch = bodyLines.find(l => l.startsWith("**HTML:**"))?.match(/\*\*HTML:\*\*\s*(\S+)/);
      let html: string | undefined;
      if (htmlMatch?.[1]) {
        try { html = atob(htmlMatch[1]); } catch { html = undefined; }
      }
      const bodyText = bodyLines
        .filter(l => !l.startsWith("**Link:**") && !l.startsWith("**HTML:**"))
        .join("\n").trim();

      const fullBody = decodeHtml(bodyText);
      parsed.push({
        id: `ms365-mail-${idx}`,
        sender: decodeHtml(sender),
        subject: decodeHtml(subject),
        date,
        preview: fullBody.slice(0, 150),
        isUnread,
        raw: fullBody,
        url,
        html,
      });
    });

    if (parsed.length > 0) return parsed;
  }

  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, idx) => {
    const cleanPara = para.trim();
    return {
      id: `fallback-mail-${idx}`,
      sender: "System Feed",
      subject: cleanPara.slice(0, 40) + (cleanPara.length > 40 ? "..." : ""),
      date: "",
      preview: cleanPara.slice(0, 150),
      isUnread: false,
      raw: cleanPara
    };
  });
}

export function parseChats(text: string | null): ParsedChat[] {
  if (!text || text.trim() === "") return [];

  if (text.includes("---")) {
    const segments = text.split(/\n+---\n+/);
    const parsed: ParsedChat[] = [];

    segments.forEach((seg, idx) => {
      const cleanSeg = seg.trim();
      if (!cleanSeg) return;

      const headerMatch = cleanSeg.match(/^###\s*(.*?)·\s*(.*)$/m);
      const headerRaw = headerMatch ? headerMatch[1].trim() : "";
      let title = "Direct Message";
      let chatType: "oneOnOne" | "group" | "meeting" | "unknown" = "unknown";
      let graphChatId: string | undefined;
      const date = headerMatch ? headerMatch[2].trim() : "";

      const typePrefixMatch = headerRaw.match(/^(oneOnOne|group|meeting|unknown)\|([^|]*)\|(.*)$/);
      if (typePrefixMatch) {
        chatType = typePrefixMatch[1] as "oneOnOne" | "group" | "meeting" | "unknown";
        graphChatId = typePrefixMatch[2] || undefined;
        title = typePrefixMatch[3].trim();
      } else {
        title = headerRaw || "Direct Message";
      }

      const allContentLines = cleanSeg.split("\n").slice(1);
      const linkMatch = allContentLines.find(l => l.startsWith("**Link:**"))?.match(/\*\*Link:\*\*\s*(https?:\/\/\S+)/);
      const url = linkMatch?.[1];

      const msgLines = allContentLines.filter(l => l.startsWith("BUBBLE|"));
      const messages: ChatMessage[] = [];
      msgLines.forEach((l, i) => {
        const parts = l.split("|");
        if (parts.length < 5) return;
        const [, tag, sender, time, ...rest] = parts;
        const text = decodeHtml(rest.join("|")).trim();
        if (!text) return;
        const chatIdForMsg = graphChatId || `ms365-chat-${idx}`;
        messages.push({
          id: `${chatIdForMsg}#msg${i}`,
          isSent: tag === "SENT",
          sender: decodeHtml(sender),
          time,
          text,
        });
      });

      const lastMsg = messages[messages.length - 1];
      const sender = lastMsg?.sender ?? "";
      const lastMessage = lastMsg?.text ?? "";

      parsed.push({
        id: graphChatId || `ms365-chat-${idx}`,
        title: decodeHtml(title),
        date,
        sender: decodeHtml(sender),
        lastMessage: decodeHtml(lastMessage),
        raw: decodeHtml(lastMessage),
        messages: messages.length > 0 ? messages : undefined,
        url,
        chatType,
        graphChatId,
      });
    });

    if (parsed.length > 0) return parsed;
  }

  return [{
    id: "fallback-chat-1",
    title: "Activity Stream",
    date: "",
    sender: "System",
    lastMessage: text.slice(0, 150),
    raw: text
  }];
}

type AsanaTaskShape = { gid: string; name: string; completed: boolean; due_on?: string | null; workspace?: { gid: string } };

export function parseAsanaTasks(data: unknown): AsanaTaskShape[] | null {
  if (!Array.isArray(data)) return null;
  return data.filter(
    (t): t is AsanaTaskShape =>
      typeof t === "object" &&
      t !== null &&
      typeof (t as { gid?: unknown }).gid === "string" &&
      typeof (t as { name?: unknown }).name === "string" &&
      typeof (t as { completed?: unknown }).completed === "boolean",
  );
}

export function extractTextContent(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const r = result as { content?: unknown };
  if (!Array.isArray(r.content)) return "";
  return r.content
    .filter((item): item is { type: "text"; text: string } =>
      typeof item === "object" &&
      item !== null &&
      (item as { type?: unknown }).type === "text" &&
      typeof (item as { text?: unknown }).text === "string"
    )
    .map((item) => item.text)
    .join("");
}

export function findChatById(chats: ParsedChat[], chatId: string | null | undefined): ParsedChat | undefined {
  if (!chatId) return undefined;
  return chats.find((c) => c.graphChatId === chatId || c.id === chatId);
}

export function findEmailById(emails: ParsedEmail[], emailId: string | null | undefined): ParsedEmail | undefined {
  if (!emailId) return undefined;
  return emails.find((e) => e.id === emailId);
}

export function findTaskByGid<T extends { gid: string }>(tasks: T[] | null, gid: string | null | undefined): T | undefined {
  if (!gid || !tasks) return undefined;
  return tasks.find((t) => t.gid === gid);
}
