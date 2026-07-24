"use client";

import { SunIcon, MoonIcon } from "@/components/icons";
import { setThemeCookie, type Theme } from "@/app/actions";

export function ThemeToggle({ current }: { current: Theme }) {
  const next: Theme = current === "dark" ? "light" : "dark";

  async function toggle() {
    document.documentElement.classList.toggle("dark", next === "dark");
    await setThemeCookie(next);
  }

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      aria-label="Toggle theme"
    >
      {current === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  );
}
