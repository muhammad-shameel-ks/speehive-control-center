"use client";

import { useNotepad } from "@/hooks/useNotepad";
import { PencilIcon } from "@/components/icons";

export function Notepad() {
  const { text, setText } = useNotepad();

  return (
    <div
      className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm"
      style={{ height: 220, minHeight: 180 }}
    >
      <div className="flex items-center gap-2 px-4 h-10 border-b border-border shrink-0">
        <PencilIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-[12px] font-semibold text-foreground">Scratchpad</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="IP addresses, serial numbers, quick notes…"
        className="flex-1 w-full resize-none p-3.5 text-[12px] font-mono text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none leading-relaxed"
      />
    </div>
  );
}
