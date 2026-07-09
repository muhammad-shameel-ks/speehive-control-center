import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const { data } = await getSession();
  return NextResponse.json({
    configured: Boolean(process.env.ASANA_CLIENT_ID),
    connected: Boolean(data.accessToken),
  });
}
