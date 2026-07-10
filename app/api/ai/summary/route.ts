import { generateText } from "ai";
import { NextResponse } from "next/server";
import { mimoV25 } from "@/lib/ai-provider";
import { rateLimitFromCookie } from "@/lib/rate-limit";

export const maxDuration = 60;

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
    const { type, content } = await req.json();
    console.log(`[ai/summary] type=${type} contentLen=${typeof content === "string" ? content.length : typeof content} contentPreview=${typeof content === "string" ? content.slice(0, 200).replace(/\n/g, "\\n") : ""}`);

    if (!content || typeof content !== "string" || content.trim() === "") {
      console.log(`[ai/summary] SKIP — empty content for type=${type}`);
      return NextResponse.json({ summary: "No data available to summarize." });
    }

    let prompt = "";

    if (type === "global") {
      prompt =
        `You are a concise executive assistant for an IT Lead Manager. ` +
        `Produce a briefing that covers ALL three source feeds present in the input: ` +
        `[MAIL], [TEAMS], [ASANA]. Each feed MUST contribute at least one bullet ` +
        `when it has meaningful content — do not skip a feed just because another felt more important. ` +
        `Constraints: 3-6 short, high-density bullets total (one feed per bullet, never mix). ` +
        `Each bullet MUST start with exactly one of these source tags: [MAIL], [TEAMS], or [ASANA] — pick the tag that matches where the item came from. ` +
        `Format: "- [SOURCE] Your bullet text here." ` +
        `Preserve red flags verbatim: threats, escalations, hostile language, and any safety/compliance signals from any feed MUST appear. ` +
        `Preserve status updates that change the user's todo list (e.g. "X finished frontend", "Y deployed v2") — these are not requests but are operationally important. ` +
        `Do not include introductory text, conversational filler, or summaries of empty/failed states:\n\n${content}`;
    } else if (type === "email") {
      prompt = 
        `Summarize the following email feed in exactly 2 concise, action-focused bullet points. ` +
        `Focus on sender names, key issues, or requests. No preamble:\n\n${content}`;
    } else if (type === "chat") {
      prompt =
        `You are triaging recent Microsoft Teams chat messages for an IT Lead Manager. ` +
        `Extract the most operationally relevant items. Use 2-5 bullet points as needed (short, dense). Do NOT collapse to a fixed count if more items matter. ` +
        `Cover ALL of these categories if present: ` +
        `- Threats, warnings, escalations, or hostile language from anyone; ` +
        `- Status updates from teammates (work completed, blocked, in progress); ` +
        `- Action items directed at the user (e.g. "please do X", "can you Y"); ` +
        `- Pending decisions awaiting the user's input; ` +
        `- FYIs about accounts, access, credentials, or shared assets. ` +
        `For each bullet, prefix with the sender name(s) and chat context in brackets, e.g. "- [Sender Name] Bullet text...". ` +
        `Preserve the actual content of concerning messages (e.g. quote threatening language verbatim when relevant) — do not paraphrase away red flags. ` +
        `Do not include introductory text. Output bullets only:\n\n${content}`;
    } else if (type === "tasks") {
      prompt = 
        `Summarize the following list of tasks in exactly 2 short bullet points. ` +
        `Highlight overdue, upcoming deadlines, or high priority items. No preamble:\n\n${content}`;
    } else {
      return NextResponse.json({ error: "Invalid summary type" }, { status: 400 });
    }

    console.log(`[ai/summary] calling model for type=${type} promptLen=${prompt.length}`);
    const result = await generateText({
      model: mimoV25,
      prompt,
      maxOutputTokens: 8000,
    });
    const { text, usage, finishReason, warnings } = result;
    console.log(`[ai/summary] OK type=${type} outputLen=${text.trim().length} finishReason=${finishReason} usage=${JSON.stringify(usage)} warnings=${JSON.stringify(warnings ?? null)}`);

    const trimmed = text.trim();
    if (!trimmed) console.warn(`[ai/summary] model returned empty text for type=${type}`);
    return NextResponse.json({ summary: trimmed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[ai/summary] ERROR:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
