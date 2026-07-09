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
import { getValidAsanaToken } from "@/lib/session-helpers";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const auth = await getValidAsanaToken();
  const tools = auth.ok ? await buildAsanaToolSet(auth.accessToken) : undefined;

  const result = streamText({
    model: mimoV25,
    system: systemPrompt(auth.ok),
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

function systemPrompt(connected: boolean): string {
  const base =
    "You are SpeeHive Assistant, a concise and friendly productivity copilot. " +
    "When you need to read or modify Asana data, ALWAYS invoke the appropriate tool using the function-calling API — never write tool calls, XML tags, or pseudo-code as part of your visible reply. " +
    "After a tool returns, summarize the relevant parts in plain language — never paste raw tool output verbatim unless asked. " +
    "If a tool returns an error, surface it honestly and suggest what to do next. " +
    "Never invent task data. " +
    "Keep responses short by default; use bullets for lists of tasks.";

  if (!connected) {
    return (
      base +
      "\n\nThe user has not connected their Asana account yet, so you have no task tools available in this turn. " +
      "Briefly tell them to connect Asana from the left sidebar to unlock task tools, and otherwise be helpful with general questions."
    );
  }
  return base;
}
