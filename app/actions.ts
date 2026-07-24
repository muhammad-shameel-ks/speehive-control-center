"use server";

import { cookies } from "next/headers";

export type Theme = "light" | "dark";

export async function setThemeCookie(theme: Theme) {
  const store = await cookies();
  store.set("theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
