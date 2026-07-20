import { NextResponse } from "next/server";
import { getAsanaServerConfig } from "@/lib/asana-server-config";
import {
  getMyTasks,
  createTask,
  updateTask,
  getWorkspaces,
  refreshAccessToken,
} from "@/lib/asana-api";
import { getSession, updateSession } from "@/lib/session";

const ALLOWED_ASANA_TOOLS = new Set<string>([
  "get_my_tasks",
  "get_task",
  "get_workspaces",
  "create_task",
  "update_task",
]);

async function getValidToken(): Promise<
  | { ok: true; accessToken: string }
  | { ok: false; response: NextResponse }
> {
  const { data } = await getSession();
  console.log("[asana:tasks] session check:", {
    hasAccessToken: !!data.accessToken,
    hasRefreshToken: !!data.refreshToken,
    expiresAt: data.expiresAt,
    now: Date.now(),
    workspaceGid: data.workspaceGid,
  });

  if (!data.accessToken || !data.refreshToken) {
    return {
      ok: false,
      response: NextResponse.json({ state: "unauthorized" as const }),
    };
  }

  const REFRESH_WINDOW_MS = 60_000;
  const needsRefresh =
    !data.expiresAt || data.expiresAt - Date.now() < REFRESH_WINDOW_MS;

  if (needsRefresh) {
    const config = await getAsanaServerConfig();
    if (!config) {
      return {
        ok: false,
        response: NextResponse.json({
          state: "unauthorized" as const,
          error: "Asana credentials not configured.",
        }),
      };
    }
    try {
      const refreshed = await refreshAccessToken(data.refreshToken, config);
      await updateSession({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
      });
      return { ok: true, accessToken: refreshed.accessToken };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        ok: false,
        response: NextResponse.json({
          state: "unauthorized" as const,
          error: `Token refresh failed: ${message}`,
        }),
      };
    }
  }

  return { ok: true, accessToken: data.accessToken };
}

export async function GET() {
  console.log("[asana:tasks] GET — fetching tasks");
  const auth = await getValidToken();
  if (!auth.ok) {
    console.log("[asana:tasks] GET — auth failed, returning:", auth.response.status);
    return auth.response;
  }
  console.log("[asana:tasks] GET — auth ok, fetching workspaces/tasks");

  try {
    const { data: session } = await getSession();
    let workspaceGid = session.workspaceGid;

    if (!workspaceGid) {
      const workspaces = await getWorkspaces(auth.accessToken);
      workspaceGid = workspaces[0]?.gid;
      if (!workspaceGid) {
        return NextResponse.json({
          state: "unauthorized" as const,
          error: "No Asana workspaces found.",
        });
      }
      await updateSession({ workspaceGid });
    }

    const tasks = await getMyTasks(auth.accessToken, workspaceGid);
    console.log(`[asana:tasks] GET — returning ${tasks.length} tasks`);
    return NextResponse.json({ state: "connected" as const, result: tasks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[asana:tasks] GET — error:", message);
    return NextResponse.json({ state: "error" as const, error: message });
  }
}

export async function POST(req: Request) {
  const { toolName, arguments: toolArgs } = await req.json();
  console.log(`[asana:tasks] POST — tool: ${toolName}`);

  if (!toolName) {
    return NextResponse.json({ error: "Missing toolName" }, { status: 400 });
  }

  if (!ALLOWED_ASANA_TOOLS.has(toolName)) {
    return NextResponse.json(
      { error: `Tool "${toolName}" is not in the allowlist.` },
      { status: 400 },
    );
  }

  const auth = await getValidToken();
  if (!auth.ok) return auth.response;

  try {
    let result: unknown;

    switch (toolName) {
      case "get_workspaces":
        result = await getWorkspaces(auth.accessToken);
        break;
      case "get_my_tasks": {
        const { data: session } = await getSession();
        let workspaceGid = session.workspaceGid;
        if (!workspaceGid) {
          const workspaces = await getWorkspaces(auth.accessToken);
          workspaceGid = workspaces[0]?.gid;
          if (workspaceGid) await updateSession({ workspaceGid });
        }
        if (!workspaceGid) {
          return NextResponse.json({
            state: "unauthorized" as const,
            error: "No Asana workspaces found.",
          });
        }
        result = await getMyTasks(auth.accessToken, workspaceGid);
        break;
      }
      case "create_task":
        result = await createTask(auth.accessToken, {
          name: (toolArgs?.name as string) ?? "Untitled Task",
          workspace: (toolArgs?.workspace as string) ?? "",
          notes: toolArgs?.notes as string | undefined,
          due_on: toolArgs?.due_on as string | undefined,
        });
        break;
      case "update_task":
        result = await updateTask(
          auth.accessToken,
          (toolArgs?.task_gid as string) ?? "",
          { completed: toolArgs?.completed as boolean | undefined },
        );
        break;
      default:
        return NextResponse.json(
          { error: `Unhandled tool: ${toolName}` },
          { status: 400 },
        );
    }

    return NextResponse.json({ state: "connected" as const, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[asana:tasks] POST — ${toolName} error:`, message);
    return NextResponse.json(
      { state: "error" as const, error: message },
      { status: 500 },
    );
  }
}
