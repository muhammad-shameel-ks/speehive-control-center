"use client";

import { useCallback, useState } from "react";
import type { ParsedEmail, ParsedChat } from "@/lib/types/briefing";

export type TaskPriority = "high" | "medium" | "low";

export type CreateTaskFormState = {
  name: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
};

function initialFormState(): CreateTaskFormState {
  return { name: "", description: "", dueDate: "", priority: "medium" };
}

export function useTaskMutations(opts: {
  asanaCreateTask: (name: string, notes: string, dueOn?: string) => Promise<boolean>;
  toggleTask: (gid: string, currentlyCompleted: boolean) => Promise<void>;
}) {
  const { asanaCreateTask, toggleTask } = opts;
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTaskFormState>(initialFormState());
  const [isCreating, setIsCreating] = useState(false);
  const [inlineInput, setInlineInput] = useState("");

  const openFromEmail = useCallback((email: ParsedEmail) => {
    setCreateForm({
      name: `Action: ${email.subject}`,
      description: `From: ${email.sender}\nDate: ${email.date}\n\nEmail Content:\n${email.preview}`,
      dueDate: "",
      priority: "medium",
    });
    setCreateOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
  }, []);

  const submitCreate = useCallback(async (): Promise<boolean> => {
    if (!createForm.name.trim()) return false;
    setIsCreating(true);
    try {
      const notes = `[Priority: ${createForm.priority.toUpperCase()}]\n\n${createForm.description}`;
      const ok = await asanaCreateTask(createForm.name, notes, createForm.dueDate);
      if (ok) {
        setCreateOpen(false);
        setCreateForm(initialFormState());
      }
      return ok;
    } finally {
      setIsCreating(false);
    }
  }, [asanaCreateTask, createForm]);

  const addInline = useCallback(
    async (name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      setInlineInput("");
      const ok = await asanaCreateTask(
        trimmed,
        "[Priority: MEDIUM]\nCreated inline from SpeeHive Control Centre",
      );
      return ok;
    },
    [asanaCreateTask],
  );

  const draftReplyForEmail = useCallback((email: ParsedEmail): string => {
    return `Please draft a professional reply to this email from ${email.sender} with subject "${email.subject}":\n\n"${email.preview}"`;
  }, []);

  const draftReplyForChat = useCallback((chat: ParsedChat): string => {
    return `Please help me draft a response to ${chat.sender} from our conversation thread:\n\n"${chat.lastMessage}"`;
  }, []);

  return {
    createOpen,
    createForm,
    isCreating,
    inlineInput,
    setCreateForm,
    setInlineInput,
    openFromEmail,
    closeCreate,
    submitCreate,
    addInline,
    toggleTask,
    draftReplyForEmail,
    draftReplyForChat,
  };
}
