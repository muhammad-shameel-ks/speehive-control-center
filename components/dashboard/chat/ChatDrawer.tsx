"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { CloseIcon } from "@/components/icons";

export function ChatDrawer({
  open,
  onClose,
  resolvedTheme,
  initialInput,
  onInputSetUsed,
}: {
  open: boolean;
  onClose: () => void;
  resolvedTheme: "dark" | "light";
  initialInput: string;
  onInputSetUsed: () => void;
}) {
  return (
    <>
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[380px] transform flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatPanel theme={resolvedTheme} initialInput={initialInput} onInputSetUsed={onInputSetUsed} />
        </div>
      </div>

      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
        />
      )}
    </>
  );
}
