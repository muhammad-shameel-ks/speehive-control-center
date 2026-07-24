"use client";

import { useCallback, useEffect, useState } from "react";
import { getAsanaConfig, syncAsana, postAsanaTool } from "@/lib/integrations/api-client";
import type { AsanaConnectionState, AsanaTask } from "@/lib/types/integrations";
import { DEFAULT_ASANA_WORKSPACE_GID } from "@/lib/types/integrations";
import { log } from "@/lib/logger";

export function useAsanaConnection() {
  const [state, setState] = useState<AsanaConnectionState>({ status: "loading", workspaceGid: null });
  const [tasks, setTasks] = useState<AsanaTask[] | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAsanaConfig()
      .then((data) => {
        if (cancelled) return;
        if (data.connected) {
          setState({ status: "connected", workspaceGid: null });
          syncAsana().then((res) => {
            if (cancelled) return;
            if (res.state === "connected") {
              const result = res.result;
              const parsed: AsanaTask[] | null =
                Array.isArray(result) ? result as AsanaTask[] : null;
              setTasks(parsed);
              if (parsed && parsed.length > 0) {
                const firstWithWorkspace = parsed.find((t) => t.workspace?.gid);
                if (firstWithWorkspace?.workspace) {
                  setState((s) => ({ ...s, workspaceGid: firstWithWorkspace.workspace!.gid }));
                }
              }
              log.asana.info(`initial load: ${parsed?.length ?? 0} tasks, result type: ${typeof result}, isArray: ${Array.isArray(result)}`);
            } else {
              log.asana.warn("initial sync failed:", res.state, (res as { error?: string }).error);
            }
          });
        } else {
          setState({ status: data.configured ? "disconnected" : "unconfigured", workspaceGid: null });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "unconfigured", workspaceGid: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await syncAsana();
      if (res.state === "connected") {
        const result = res.result;
        const parsed: AsanaTask[] | null =
          Array.isArray(result) ? result as AsanaTask[] : null;
        setTasks(parsed);
        if (parsed && parsed.length > 0) {
          const firstWithWorkspace = parsed.find((t) => t.workspace?.gid);
          if (firstWithWorkspace?.workspace) {
            setState((s) => ({ ...s, status: "connected", workspaceGid: firstWithWorkspace.workspace!.gid }));
            return;
          }
        }
        setState((s) => ({ ...s, status: "connected" }));
      } else {
        setTasks(null);
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  const toggleTask = useCallback(
    async (gid: string, currentlyCompleted: boolean) => {
      if (!tasks) return;
      setTasks(tasks.map((t) => (t.gid === gid ? { ...t, completed: !t.completed } : t)));
      try {
        await postAsanaTool({
          toolName: "update_task",
          arguments: { task_gid: gid, completed: !currentlyCompleted },
        });
      } catch (err) {
        log.asana.error("Failed to update task status in Asana:", err);
      }
    },
    [tasks],
  );

  const ensureWorkspaceGid = useCallback(async (): Promise<string> => {
    if (state.workspaceGid) return state.workspaceGid;
    if (tasks && tasks.length > 0) {
      const firstWithWorkspace = tasks.find((t) => t.workspace?.gid);
      if (firstWithWorkspace?.workspace) return firstWithWorkspace.workspace.gid;
    }
    try {
      const res = await postAsanaTool({ toolName: "get_workspaces", arguments: {} });
      if (res.state === "connected") {
        const workspaces = res.result as Array<{ gid: string }>;
        const gid = workspaces?.[0]?.gid;
        if (gid) {
          setState((s) => ({ ...s, workspaceGid: gid }));
          return gid;
        }
      }
    } catch (err) {
      log.asana.error("Failed to fetch Asana workspaces:", err);
    }
    return DEFAULT_ASANA_WORKSPACE_GID;
  }, [state.workspaceGid, tasks]);

  const createTask = useCallback(
    async (name: string, notes: string, dueOn?: string): Promise<boolean> => {
      const workspace = await ensureWorkspaceGid();
      try {
        const res = await postAsanaTool({
          toolName: "create_task",
          arguments: {
            name,
            workspace,
            notes,
            due_on: dueOn || undefined,
          },
        });
        if (res.state === "connected" || (res as { result?: unknown }).result !== undefined) {
          await refresh();
          return true;
        }
        return false;
      } catch (err) {
        log.asana.error("Failed to create Asana task:", err);
        return false;
      }
    },
    [ensureWorkspaceGid, refresh],
  );

  return {
    state,
    tasks,
    syncing,
    refresh,
    toggleTask,
    createTask,
    ensureWorkspaceGid,
  };
}
