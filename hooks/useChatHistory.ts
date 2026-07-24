"use client";

import { useEffect, useRef, useState } from "react";
import type { UIMessage } from "@ai-sdk/react";

const STORAGE_KEY = "speehive_chat_v1";
const MAX_MESSAGES = 50;
const MAX_BYTES = 200_000;

function isStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const probe = "__speehive_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function loadMessages(): UIMessage[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as UIMessage[];
  } catch {
    return [];
  }
}

function saveMessages(messages: UIMessage[]): void {
  if (!isStorageAvailable()) return;
  try {
    const trimmed =
      messages.length > MAX_MESSAGES
        ? messages.slice(messages.length - MAX_MESSAGES)
        : messages;
    const json = JSON.stringify(trimmed);
    if (json.length > MAX_BYTES) return;
    window.localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // localStorage full or unavailable — drop silently
  }
}

export function useChatHistory() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [ready, setReady] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    setMessages(loadMessages());
    setReady(true);
  }, []);

  function persist(msgs: UIMessage[]): void {
    if (!mountedRef.current) return;
    saveMessages(msgs);
  }

  function clear(): void {
    if (!isStorageAvailable()) return;
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return {
    messages,
    persist,
    clear,
    ready,
    hasHistory: ready && messages.length > 0,
  };
}
