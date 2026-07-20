import { dynamicTool } from "ai";
import { z } from "zod";
import type { ToolSet } from "ai";
import {
  getMyTasks,
  createTask,
  updateTask,
  getWorkspaces,
} from "@/lib/asana-api";

type ToolDef = {
  description: string;
  inputSchema: z.ZodType;
  execute: (args: Record<string, unknown>, accessToken: string) => Promise<unknown>;
};

const ASANA_TOOL_DEFS: Record<string, ToolDef> = {
  get_workspaces: {
    description: "List all Asana workspaces the user has access to.",
    inputSchema: z.object({}),
    execute: async (_args, token) => getWorkspaces(token),
  },
  get_my_tasks: {
    description:
      "Get all tasks assigned to the authenticated user in a workspace. Returns tasks with name, completion status, and due date.",
    inputSchema: z.object({
      workspace: z.string().describe("The workspace GID to fetch tasks from"),
    }),
    execute: async (args, token) =>
      getMyTasks(token, args.workspace as string),
  },
  create_task: {
    description: "Create a new task in Asana.",
    inputSchema: z.object({
      name: z.string().describe("The task name"),
      workspace: z.string().describe("The workspace GID to create the task in"),
      notes: z.string().optional().describe("Optional task notes/description"),
      due_on: z
        .string()
        .optional()
        .describe("Optional due date in YYYY-MM-DD format"),
    }),
    execute: async (args, token) =>
      createTask(token, {
        name: args.name as string,
        workspace: args.workspace as string,
        notes: args.notes as string | undefined,
        due_on: args.due_on as string | undefined,
      }),
  },
  update_task: {
    description:
      "Update an existing task. Use this to mark a task as completed or incomplete, or to rename it.",
    inputSchema: z.object({
      task_gid: z.string().describe("The GID of the task to update"),
      completed: z.boolean().optional().describe("New completion status"),
      name: z.string().optional().describe("New task name"),
    }),
    execute: async (args, token) =>
      updateTask(token, args.task_gid as string, {
        completed: args.completed as boolean | undefined,
        name: args.name as string | undefined,
      }),
  },
};

export async function buildAsanaToolSet(accessToken: string): Promise<ToolSet> {
  const tools: ToolSet = {};
  for (const [name, def] of Object.entries(ASANA_TOOL_DEFS)) {
    tools[name] = dynamicTool({
      description: def.description,
      inputSchema: def.inputSchema,
      execute: async (args) => {
        try {
          return await def.execute(args as Record<string, unknown>, accessToken);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error(`[asana:tools] ${name} failed:`, message);
          return { error: `Asana tool ${name} failed: ${message}` };
        }
      },
    });
  }
  return tools;
}
