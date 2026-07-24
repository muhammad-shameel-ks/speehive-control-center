import { cookies } from "next/headers";
import { DashboardShell } from "@/components/DashboardShell";
import type { Theme } from "@/app/actions";

type SearchParams = Promise<{
  asana?: string;
  asana_error?: string;
  ms365?: string;
  ms365_error?: string;
}>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [sp, store] = await Promise.all([searchParams, cookies()]);
  const theme: Theme = store.get("theme")?.value === "light" ? "light" : "dark";

  return <DashboardShell searchParams={sp} theme={theme} />;
}
