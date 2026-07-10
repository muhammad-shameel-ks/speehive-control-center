import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

const SID_COOKIE = "sh_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function proxy(request: NextRequest) {
  if (request.cookies.get(SID_COOKIE)) {
    return NextResponse.next();
  }
  const response = NextResponse.next();
  response.cookies.set(SID_COOKIE, randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
