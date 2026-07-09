import { syncOutlookMail, syncMs365Teams, syncAsana } from "@/lib/integrations/api-client";

export type RefreshAllInput = {
  ms365Connected: boolean;
  asanaConnected: boolean;
};

export async function refreshAllIntegrations({
  ms365Connected,
  asanaConnected,
}: RefreshAllInput): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  if (ms365Connected) {
    tasks.push(syncOutlookMail(0), syncMs365Teams());
  }
  if (asanaConnected) {
    tasks.push(syncAsana());
  }
  await Promise.all(tasks);
}
