import { NextRequest, NextResponse } from "next/server";

const SUPABASE_INTERNAL = process.env.SUPABASE_INTERNAL_URL ?? "http://127.0.0.1:54321";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function OPTIONS(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

async function proxy(req: NextRequest, { path }: { path: string[] }) {
  const joined = path.join("/");
  const search = req.nextUrl.search ?? "";
  const target = `${SUPABASE_INTERNAL}/${joined}${search}`;

  const reqHeaders = new Headers(req.headers);
  reqHeaders.delete("host");

  const upstream = await fetch(target, {
    method: req.method,
    headers: reqHeaders,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    duplex: "half",
  } as RequestInit & { duplex: string });

  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("transfer-encoding");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}
