import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  hasToolCall,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { mimoV25 } from "@/lib/ai-provider";
import { buildAsanaToolSet } from "@/lib/asana-tools";
import { rateLimitFromCookie } from "@/lib/rate-limit";
import { getValidAsanaToken } from "@/lib/session-helpers";
import { getUserIdentity, type UserIdentity } from "@/lib/session";

export const maxDuration = 60;

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const sidMatch = /(?:^|;\s*)sh_session=([^;]*)/.exec(cookie);
  const sid = sidMatch ? sidMatch[1] : undefined;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip");
  const rl = rateLimitFromCookie(sid, ip, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const auth = await getValidAsanaToken();
  const identity = await getUserIdentity();
  const tools = auth.ok ? await buildAsanaToolSet(auth.accessToken) : undefined;

  const result = streamText({
    model: mimoV25,
    system: systemPrompt(auth.ok, identity),
    messages: await convertToModelMessages(messages),
    tools,
    toolChoice: "auto",
    maxOutputTokens: 4000,
    stopWhen: [isStepCount(25), hasToolCall("create_task")],
    providerOptions: {
      "opencode-go": {
        reasoningEffort: "low",
        textVerbosity: "low",
      },
    },
    onStepFinish: ({ toolCalls, toolResults, finishReason }) => {
      if (toolCalls.length > 0) {
        console.log(
          `[chat] step finished: toolCalls=${toolCalls.length} finishReason=${finishReason}`,
        );
      }
      if (toolResults.length > 0) {
        for (const r of toolResults) {
          const output = "output" in r ? r.output : undefined;
          const preview =
            typeof output === "string"
              ? output.slice(0, 120)
              : JSON.stringify(output)?.slice(0, 120);
          console.log(`[chat] tool ${r.toolName} → ${preview}`);
        }
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (e) => (e instanceof Error ? e.message : "Chat error"),
    }),
  });
}

function systemPrompt(connected: boolean, identity: UserIdentity): string {
  const userContext = identity.name || identity.email
    ? `\n\nUSER IDENTITY:\nThe logged-in user is ${identity.name ?? "the user"}${identity.email ? ` (email: ${identity.email})` : ""}. ` +
      `When drafting email or chat replies, ALWAYS sign off with their actual name ("${identity.name ?? identity.email?.split("@")[0]}") instead of generic placeholders like '[Your Name]'.`
    : "";

  const base =
    "You are SpeeHive Assistant, a concise and friendly productivity copilot. " +
    "When you need to read or modify Asana data, ALWAYS invoke the appropriate tool using the function-calling API — never write tool calls, XML tags, or pseudo-code as part of your visible reply. " +
    "After a tool returns, summarize the relevant parts in plain language — never paste raw tool output verbatim unless asked. " +
    "If a tool returns an error, surface it honestly and suggest what to do next. " +
    "Never invent task data. " +
    "Keep responses short by default; use bullets for lists of tasks. " +
    "CRITICAL FOR DRAFT REPLIES: When asked to draft a reply or response to an email, message, or chat, output ONLY the draft reply content itself. Do NOT append any conversational commentary, 'Before sending:' notes, disclaimers, or Asana connection reminders after the draft reply." +
    userContext;

  if (!connected) {
    return (
      base +
      "\n\nNote: Asana is not connected yet. Only inform the user about connecting Asana if they explicitly ask to query, create, or manage Asana tasks. NEVER append Asana connection reminders or sign-up messages to draft replies or general answers."
    );
  }
  return base;
}
