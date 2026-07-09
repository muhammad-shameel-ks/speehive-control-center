"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "speehive_notepad";
const DEFAULT_NOTES = [
  "- Server IP: 10.0.4.88",
  "- AWS Billing Review: July 12",
  "- Alice Laptop Serial: C02F54G1Q05D",
  "- Okta SSO setup details pending",
].join("\n");

export function useNotepad(): {
  text: string;
  setText: (next: string) => void;
} {
  const [text, setTextState] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTextState(saved);
    } else {
      setTextState(DEFAULT_NOTES);
      localStorage.setItem(STORAGE_KEY, DEFAULT_NOTES);
    }
  }, []);

  const setText = useCallback((next: string) => {
    setTextState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return { text, setText };
}
