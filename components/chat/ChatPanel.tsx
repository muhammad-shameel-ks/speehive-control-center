"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type DynamicToolUIPart, type UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatHistory } from "@/hooks/useChatHistory";

function isDynamicToolPart(
  part: UIMessage["parts"][number],
): part is DynamicToolUIPart {
  return part.type === "dynamic-tool";
}

function compactJson(value: unknown): string {
  if (value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const markdownComponents: Components = {
  a({ href, children, ...rest }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
        {...rest}
      >
        {children}
      </a>
    );
  },
};

function Markdown({ text, theme = "dark" }: { text: string; theme?: "dark" | "light" }) {
  if (!text) return null;
  const isDark = theme === "dark";
  return (
    <div
      className={[
        "markdown text-sm leading-relaxed",
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-0.5",
        "[&_h1]:mt-3 [&_h1]:mb-1 [&_h1]:text-base [&_h1]:font-semibold",
        "[&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-[0.95rem] [&_h2]:font-semibold",
        "[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold",
        "[&_strong]:font-semibold",
        "[&_em]:italic",
        "[&_hr]:my-3 [&_hr]:border-zinc-200",
        isDark 
          ? "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-700 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-zinc-400"
          : "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-zinc-650",
        isDark
          ? "[&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-indigo-300"
          : "[&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-indigo-650",
        isDark
          ? "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-950 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[0.8rem] [&_pre]:text-zinc-300 [&_pre]:border [&_pre]:border-zinc-800"
          : "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-100 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[0.8rem] [&_pre]:text-zinc-750 [&_pre]:border [&_pre]:border-zinc-200",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
        "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs",
        isDark
          ? "[&_th]:border [&_th]:border-zinc-800 [&_th]:bg-zinc-900/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_th]:text-zinc-200"
          : "[&_th]:border [&_th]:border-zinc-200 [&_th]:bg-zinc-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_th]:text-zinc-800",
        isDark
          ? "[&_td]:border [&_td]:border-zinc-800 [&_td]:px-2 [&_td]:py-1 [&_td]:text-zinc-300"
          : "[&_td]:border [&_td]:border-zinc-200 [&_td]:px-2 [&_td]:py-1 [&_td]:text-zinc-700",
      ].join(" ")}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

function ToolCallCard({ part, theme = "dark" }: { part: DynamicToolUIPart; theme?: "dark" | "light" }) {
  const [expanded, setExpanded] = useState(false);
  const isDark = theme === "dark";
  const stateLabel =
    part.state === "input-streaming"
      ? "Calling"
      : part.state === "input-available"
        ? "Awaiting result"
        : part.state === "output-available"
          ? "Done"
          : "Error";

  return (
    <div className={`my-2 overflow-hidden rounded-lg border ${
      isDark ? "border-zinc-850 bg-zinc-900/30" : "border-zinc-200 bg-zinc-50/50"
    }`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium ${
          isDark ? "text-zinc-300 hover:bg-zinc-850/40" : "text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              part.state === "output-available"
                ? "bg-emerald-500"
                : part.state === "output-error"
                  ? "bg-rose-500"
                  : "animate-pulse bg-amber-500"
            }`}
          />
          <span className={`font-mono ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{part.toolName}</span>
          <span className={isDark ? "text-zinc-500" : "text-zinc-400"}>· {stateLabel}</span>
        </span>
        <span className={isDark ? "text-zinc-500" : "text-zinc-400"}>{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <div className={`border-t px-3 py-2 text-xs ${isDark ? "border-zinc-850" : "border-zinc-200"}`}>
          {part.state !== "input-streaming" && part.input !== undefined && (
            <div className="mb-2">
              <div className={`mb-1 font-medium ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>Input</div>
              <pre className={`max-h-40 overflow-auto rounded border p-2 font-mono text-[11px] ${
                isDark ? "border-zinc-800 bg-zinc-950 text-zinc-300" : "border-zinc-200 bg-white text-zinc-700"
              }`}>
                {compactJson(part.input)}
              </pre>
            </div>
          )}
          {part.state === "output-available" && (
            <div>
              <div className={`mb-1 font-medium ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>Output</div>
              <pre className={`max-h-60 overflow-auto rounded border p-2 font-mono text-[11px] ${
                isDark ? "border-zinc-800 bg-zinc-950 text-zinc-300" : "border-zinc-200 bg-white text-zinc-700"
              }`}>
                {compactJson(part.output)}
              </pre>
            </div>
          )}
          {part.state === "output-error" && (
            <div className={`rounded border px-2 py-1 ${
              isDark ? "bg-rose-955/50 border-rose-900/50 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-700"
            }`}>
              {part.errorText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, theme = "dark" }: { message: UIMessage; theme?: "dark" | "light" }) {
  const isUser = message.role === "user";
  const isDark = theme === "dark";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-650 shadow-md">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-none bg-indigo-600 px-4 py-3 text-white shadow-md shadow-indigo-900/20"
            : isDark
              ? "rounded-tl-none border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-200 shadow-lg"
              : "rounded-tl-none border border-zinc-200 bg-white px-4 py-3 text-zinc-800 shadow-sm"
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return <Markdown key={i} text={part.text} theme={theme} />;
          }
          if (part.type === "step-start") {
            return <hr key={i} className={`my-2 ${isDark ? "border-zinc-800" : "border-zinc-200"}`} />;
          }
          if (isDynamicToolPart(part)) {
            return <ToolCallCard key={i} part={part} theme={theme} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function ChatPanel({
  theme = "dark",
  initialInput = "",
  onInputSetUsed
}: {
  theme?: "dark" | "light";
  initialInput?: string;
  onInputSetUsed?: () => void;
}) {
  const { messages: initialHistory, persist, clear, hasHistory } = useChatHistory();
  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    id: "speehive-chat",
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: initialHistory,
  });

  useEffect(() => {
    persist(messages);
  }, [messages, persist]);

  const onClear = useCallback(() => {
    clear();
    setMessages([]);
  }, [clear, setMessages]);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialInput) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(initialInput);
      onInputSetUsed?.();
    }
  }, [initialInput, onInputSetUsed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = input.trim();
    if (!text || status !== "ready") return;
    sendMessage({ text });
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  const isStreaming = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;
  const isDark = theme === "dark";

  return (
    <div className={`flex h-full flex-col transition-colors duration-200 ${
      isDark ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"
    }`}>
      <div className={`flex items-center justify-between border-b px-6 py-4 ${
        isDark ? "border-zinc-850 bg-zinc-900/20" : "border-zinc-200 bg-zinc-50/50"
      }`}>
        <div>
          <p className={`text-sm font-semibold ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>SpeeHive Assistant</p>
          <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-550" : "text-zinc-500"}`}>
            Ask about your tasks, emails, and workspace
          </p>
        </div>
        {hasHistory && (
          <button
            type="button"
            onClick={onClear}
            className={`rounded border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              isDark
                ? "border-zinc-800 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            }`}
          >
            Clear
          </button>
        )}
      </div>
 
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6 scrollbar-thin">
        {!hasMessages && (
          <div className="flex justify-start">
            <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-650 shadow-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
              </svg>
            </div>
            <div className={`max-w-[85%] rounded-2xl rounded-tl-none border px-4 py-3 text-sm leading-relaxed shadow-lg ${
              isDark ? "border-zinc-800 bg-zinc-900 text-zinc-200" : "border-zinc-200 bg-white text-zinc-700"
            }`}>
              Hi! I&apos;m your SpeeHive assistant. Ask me anything about your
              tasks, emails, or workspace.
            </div>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} theme={theme} />
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-650 shadow-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
              </svg>
            </div>
            <div className={`flex items-center gap-1 rounded-2xl rounded-tl-none border px-4 py-3 shadow-md ${
              isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"
            }`}>
              <span className={`h-1.5 w-1.5 animate-bounce rounded-full ${isDark ? "bg-zinc-550" : "bg-zinc-400"} [animation-delay:0ms]`} />
              <span className={`h-1.5 w-1.5 animate-bounce rounded-full ${isDark ? "bg-zinc-550" : "bg-zinc-400"} [animation-delay:150ms]`} />
              <span className={`h-1.5 w-1.5 animate-bounce rounded-full ${isDark ? "bg-zinc-550" : "bg-zinc-400"} [animation-delay:300ms]`} />
            </div>
          </div>
        )}
        {error && (
          <div className={`rounded-lg border px-3 py-2 text-xs ${
            isDark ? "border-rose-900/50 bg-rose-950/50 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}>
            {error.message}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={`border-t px-4 py-4 ${
        isDark ? "border-zinc-850 bg-zinc-900/30" : "border-zinc-200 bg-zinc-50/50"
      }`}>
        <div className={`flex items-end gap-3 rounded-2xl border px-4 py-3 ${
          isDark ? "border-zinc-800 bg-zinc-900/60 backdrop-blur-md" : "border-zinc-200 bg-white"
        }`}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={onKeyDown}
            placeholder="Ask anything or request actions…"
            className={`flex-1 resize-none bg-transparent text-sm focus:outline-none ${
              isDark ? "text-zinc-200 placeholder:text-zinc-500" : "text-zinc-800 placeholder:text-zinc-400"
            }`}
            style={{ maxHeight: "160px" }}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={() => stop()}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isDark ? "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "border-zinc-300 bg-white text-zinc-650 hover:bg-zinc-100"
              }`}
              aria-label="Stop generating"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:hover:shadow-none"
              aria-label="Send message"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
            </button>
          )}
        </div>
        <p className={`mt-2 text-center text-[10px] ${isDark ? "text-zinc-650" : "text-zinc-450"}`}>
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
