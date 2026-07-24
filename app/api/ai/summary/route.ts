import { generateText } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { mimoV25 } from "@/lib/ai-provider";
import { rateLimitFromCookie } from "@/lib/rate-limit";
import { parseEmails } from "@/lib/parser";
import { log } from "@/lib/logger";

export const maxDuration = 60;

const ChatRefSchema = z.object({
  chatId: z.string().describe("The chatId printed after 'chatId:' in the chat header. Use empty string if not applicable."),
  messageIndex: z.number().int().nonnegative().nullable().describe("The [msg M] index of the specific message, if you can identify it. Use null if not applicable."),
});

const EmailRefSchema = z.object({
  emailId: z.string().describe("The emailId printed after 'id:' in the email header."),
});

const TaskRefSchema = z.object({
  taskGid: z.string().describe("The task gid printed after 'id:' in the task line."),
});

const SummarySchema = z.object({
  emailSummary: z.string().default(""),
  chatSummary: z.string().default(""),
  tasksSummary: z.string().default(""),
  globalDigest: z.string().default(""),
  chatRefs: z.array(ChatRefSchema).default([]),
  globalRefs: z.array(ChatRefSchema.nullable()).default([]),
  emailRefs: z.array(EmailRefSchema).default([]),
  taskRefs: z.array(TaskRefSchema).default([]),
});

const repairJsonText = async ({ text }: { text: string; error: unknown }): Promise<string> => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first !== -1 && last > first) return candidate.slice(first, last + 1);
  return candidate;
};

async function generateValidatedSummary(prompt: string) {
  const corrective =
    "\n\nIMPORTANT: Your previous response was invalid. " +
    "Return ONLY a single valid JSON object matching the schema above. " +
    "No markdown fences, no commentary, no extra text.";

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await generateText({
      model: mimoV25,
      prompt: attempt === 0 ? prompt : prompt + corrective,
    });

    const raw = result.text;
    if (!raw) {
      log.summary.warn(`model returned empty text on attempt=${attempt + 1}`);
      continue;
    }

    const repaired = await repairJsonText({ text: raw, error: null });
    try {
      const json = JSON.parse(repaired);
      const parsed = SummarySchema.safeParse(json);
      if (parsed.success) {
        log.summary.info(
          `parse OK on attempt=${attempt + 1} usage=${JSON.stringify(result.usage ?? null)}`,
        );
        return parsed.data;
      }
      log.summary.warn(
        `Zod validation failed on attempt=${attempt + 1}: ${parsed.error.message}`,
      );
    } catch (e) {
      log.summary.warn(
        `JSON.parse failed on attempt=${attempt + 1}: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
  throw new Error("Failed to produce a valid summary JSON after retry");
}

function formatChatForAI(raw: string): string {
  if (!raw) return raw;
  const segments = raw.split(/\n+---\n+/);
  const output: string[] = [];
  let chatIdx = 0;

  for (const seg of segments) {
    const lines = seg.trim().split("\n");
    if (lines.length === 0) continue;

    const headerLine = lines[0];
    const headerMatch = headerLine.match(/^###\s*(.*?)·\s*(.*)$/m);
    if (!headerMatch) continue;

    const headerRaw = headerMatch[1].trim();
    const typeMatch = headerRaw.match(/^(oneOnOne|group|meeting|unknown)\|([^|]*)\|(.*)$/);
    const chatType = typeMatch?.[1] ?? "unknown";
    const graphChatId = typeMatch?.[2] ?? "";
    const title = typeMatch?.[3]?.trim() ?? headerRaw;

    const bubbleLines = lines.filter(l => l.startsWith("BUBBLE|"));
    const messages: string[] = [];
    let msgIdx = 0;

    for (const line of bubbleLines) {
      const parts = line.split("|");
      if (parts.length < 5) continue;
      const [, tag, sender, time, ...rest] = parts;
      const text = rest.join("|").trim();
      if (!text) continue;
      const prefix = tag === "SENT" ? "[You]" : `[${sender}]`;
      const timeStr = time ? ` ${time}` : "";
      messages.push(`  [msg ${msgIdx}] ${prefix}${timeStr}: ${text}`);
      msgIdx++;
    }

    if (messages.length === 0) continue;

    output.push(
      `[Chat ${chatIdx}] "${title}" (${chatType}) — chatId:${graphChatId}`,
      ...messages,
      ""
    );
    chatIdx++;
  }

  return output.join("\n").trim();
}

function formatEmailsForAI(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/\*\*HTML:\*\*\s*\S+/g, "").trim();
  if (!cleaned) return "";
  const emails = parseEmails(cleaned);
  if (emails.length === 0) return cleaned;
  return emails
    .map((e, i) => {
      const divider = i > 0 ? "\n---\n\n" : "";
      const body = e.raw && e.raw !== e.subject ? `\n${e.raw}` : "";
      return `${divider}### ${e.subject} — id:${e.id}\n**From:** ${e.sender} · ${e.date}${body}`;
    })
    .join("");
}

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const sidMatch = /(?:^|;\s*)sh_session=([^;]*)/.exec(cookie);
  const sid = sidMatch ? sidMatch[1] : undefined;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip");
  const rl = rateLimitFromCookie(sid, ip, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  try {
    const body = await req.json();

    // Unified request format — generate all summaries in one call
    if ("emailContent" in body || "chatContent" in body || "tasksContent" in body) {
      const { emailContent, chatContent, tasksContent } = body;
      const formattedEmails = formatEmailsForAI(emailContent || "");
      const formattedChat = formatChatForAI(chatContent || "");
      log.summary.info(`Unified request received. emailLen=${formattedEmails.length}, chatLen=${formattedChat.length}, tasksLen=${tasksContent?.length ?? 0}`);

      const prompt = `You are a notification triage assistant for an IT Lead Manager. Your job is to produce a quick TLDR of what OTHERS have sent, requested, or escalated — NOT what the user has done.

CRITICAL RULES:
- In chats, lines starting with "[You]" are messages the user sent. IGNORE them completely. Only summarize what others said.
- In emails, ignore any sent items or replies from the user. Focus only on inbound messages from others.
- NEVER write bullets like "You completed...", "You sent...", "You replied...", or "You asked...".
- Focus on: what others are requesting, reporting, escalating, or waiting for. What needs the user's attention.
- Keep bullets extremely short — this is a quick glance, not a report.
- Every chatSummary, emailSummary, and tasksSummary bullet MUST include a matching ref entry pointing to the exact chatId/emailId/taskGid it came from.
- Every globalDigest bullet that references a specific chat MUST include a chatId in the matching globalRefs entry. Use null for [MAIL] or [ASANA] bullets when no specific item is being highlighted.

=== EMAILS (each labeled with id) ===
${formattedEmails || "(No unread emails)"}

=== TEAMS CHATS (each labeled with chatId) ===
${formattedChat || "(No recent chats)"}

=== ASANA TASKS (each labeled with id) ===
${tasksContent || "(No tasks)"}

Respond with a JSON object only. No markdown fences, no preamble, no extra text.

JSON fields:
- "emailSummary": 1-2 bullets on inbound emails — who sent what, what they need. Empty string if nothing inbound.
- "chatSummary": 1-3 bullets on what others said in chats — ignore [You] lines. Each bullet must cover exactly ONE message from ONE person in ONE chat. Write a short description of what they said/need. Empty string if nothing from others.
- "tasksSummary": 1-2 bullets on overdue, upcoming, or high-priority tasks. Empty string if no tasks.
- "globalDigest": 2-4 bullets covering the most important inbound signals across all feeds. Each MUST start with [MAIL], [TEAMS], or [ASANA]. Write a short description.
- "chatRefs": Array of {chatId, messageIndex} objects — one per chatSummary bullet, in the same order. "chatId" is the chatId printed after "chatId:" in the chat header. "messageIndex" is the [msg M] index if you can identify the exact message, otherwise null.
- "globalRefs": Array of {chatId, messageIndex} or null — one entry per globalDigest bullet, in the same order. Use null for [MAIL] or [ASANA] bullets that do not reference a specific chat. For [TEAMS] bullets referencing a chat, set chatId; for chat-message-specific highlights, set messageIndex too.
- "emailRefs": Array of {emailId} objects — one per emailSummary bullet, in the same order. emailId is the id printed after "id:" in the email header. If the bullet does not reference a specific email, use an empty string.
- "taskRefs": Array of {taskGid} objects — one per tasksSummary bullet, in the same order. taskGid is the id printed after "id:" in the task line. If the bullet does not reference a specific task, use an empty string.

Example input chats:
[Chat 0] "Project Alpha" (group) — chatId:19:thread_alpha
  [msg 0] [You] 10:00 AM: sounds good
  [msg 1] [Bob] 10:05 AM: staging server is down
[Chat 1] "Alice" (oneOnOne) — chatId:19:thread_alice
  [msg 0] [Alice] 9:30 AM: need sign-off on contract

Example input emails:
### Vendor contract needs sign-off — id:ms365-mail-0
**From:** Alice Smith · Mon 9:30 AM
Need sign-off on the vendor contract by EOD.

Example input tasks:
- Sign vendor contract (id:12345, Pending)

Example output:
{"emailSummary":"- [Alice] needs sign-off on the vendor contract by EOD","chatSummary":"- Bob reports staging server is down","tasksSummary":"- 1 task pending: sign vendor contract","globalDigest":"- [TEAMS] Bob reports staging server is down","chatRefs":[{"chatId":"19:thread_alpha","messageIndex":1}],"globalRefs":[{"chatId":"19:thread_alpha","messageIndex":1}],"emailRefs":[{"emailId":"ms365-mail-0"}],"taskRefs":[{"taskGid":"12345"}]}`;

      log.summary.info("Calling generateText for unified summary");
      const parsed = await generateValidatedSummary(prompt);

      return NextResponse.json({
        emailSummary: parsed.emailSummary ?? "",
        chatSummary: parsed.chatSummary ?? "",
        tasksSummary: parsed.tasksSummary ?? "",
        globalDigest: parsed.globalDigest ?? "",
        chatRefs: Array.isArray(parsed.chatRefs) ? parsed.chatRefs : [],
        globalRefs: Array.isArray(parsed.globalRefs) ? parsed.globalRefs : [],
        emailRefs: Array.isArray(parsed.emailRefs) ? parsed.emailRefs : [],
        taskRefs: Array.isArray(parsed.taskRefs) ? parsed.taskRefs : [],
      });
    }

    // Legacy single summary format
    const { type, content } = body;
    log.summary.info(`type=${type} contentLen=${typeof content === "string" ? content.length : typeof content}`);

    if (!content || typeof content !== "string" || content.trim() === "") {
      log.summary.info(`SKIP — empty content for type=${type}`);
      return NextResponse.json({ summary: "No data available to summarize." });
    }

    let prompt = "";

    if (type === "global") {
      prompt =
        `You are a concise executive assistant for an IT Lead Manager. ` +
        `Produce a briefing that covers ALL three source feeds present in the input: ` +
        `[MAIL], [TEAMS], [ASANA]. Each feed MUST contribute at least one bullet ` +
        `when it has meaningful content. ` +
        `Constraints: 3-5 extremely short, high-density bullets total (max 1 sentence per bullet). ` +
        `Each bullet MUST start with exactly one of these source tags: [MAIL], [TEAMS], or [ASANA]. ` +
        `Format: "- [SOURCE] Your bullet text here." ` +
        `Preserve red flags verbatim (threats, escalations, hostile language) and critical status updates. ` +
        `Do not include introductory text, conversational filler, or summaries of empty/failed states:\n\n${content}`;
    } else if (type === "email") {
      prompt =
        `Summarize the following email feed in exactly 2 concise, action-focused bullet points (max 1 sentence per bullet). ` +
        `Focus on sender names, key issues, or requests. No preamble:\n\n${content}`;
    } else if (type === "chat") {
      prompt =
        `You are triaging recent Microsoft Teams chat messages for an IT Lead Manager. ` +
        `Extract the most operationally relevant items. Use 2-3 extremely concise bullet points total (maximum 1 sentence per bullet). ` +
        `CRITICAL: Each bullet must cover exactly ONE message from ONE person in ONE conversation. ` +
        `Focus on critical threats/warnings, teammate status updates, actions directed at the user, or shared credentials. ` +
        `For each bullet, prefix with the sender name and chat context in brackets, e.g. "- [Sender Name] (Chat: topic-or-DM) text...". ` +
        `The "Chat:" part must include the conversation topic for group chats or "DM" for direct messages. ` +
        `Do not include introductory text. Output bullets only:\n\n${content}`;
    } else if (type === "tasks") {
      prompt =
        `Summarize the following list of tasks in exactly 1-2 extremely short bullet points (max 1 sentence per bullet). ` +
        `Highlight overdue, upcoming deadlines, or high priority items. No preamble:\n\n${content}`;
    } else {
      return NextResponse.json({ error: "Invalid summary type" }, { status: 400 });
    }

    log.summary.info(`calling model for type=${type} promptLen=${prompt.length}`);
    const result = await generateText({
      model: mimoV25,
      prompt,
      maxOutputTokens: 8000,
    });
    const { text, usage, finishReason, warnings } = result;
    log.summary.info(`OK type=${type} outputLen=${text.trim().length} finishReason=${finishReason} usage=${JSON.stringify(usage)} warnings=${JSON.stringify(warnings ?? null)}`);

    const trimmed = text.trim();
    if (!trimmed) log.summary.warn(`model returned empty text for type=${type}`);
    return NextResponse.json({ summary: trimmed });
  } catch (err) {
    log.summary.error(`ERROR:`, err);
    return NextResponse.json(
      { error: "An internal error occurred. Please try again." },
      { status: 500 },
    );
  }
}
