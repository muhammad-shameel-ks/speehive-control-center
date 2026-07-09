import { generateText } from "ai";
import { NextResponse } from "next/server";
import { mimoV25 } from "@/lib/ai-provider";

export const maxDuration = 60;

export async function POST(req: Request) {
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
        `Summarize the overall status and key action items from the following combined inbox, chat, and task feed. ` +
        `Provide exactly 2-4 short, high-density bullet points. ` +
        `Each bullet MUST start with exactly one of these source tags: [MAIL], [TEAMS], or [ASANA] — pick the tag that matches where the item came from. ` +
        `Format: "- [SOURCE] Your bullet text here." ` +
        `Do not include introductory text, conversational filler, or summaries of empty/failed states. ` +
        `Focus only on urgent alerts, pending decisions, or required actions:\n\n${content}`;
    } else if (type === "email") {
      prompt = 
        `Summarize the following email feed in exactly 2 concise, action-focused bullet points. ` +
        `Focus on sender names, key issues, or requests. No preamble:\n\n${content}`;
    } else if (type === "chat") {
      prompt = 
        `Summarize the following chat feed in exactly 2 short bullet points. ` +
        `Focus on active discussions, pending decisions, or immediate requests. No preamble:\n\n${content}`;
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
