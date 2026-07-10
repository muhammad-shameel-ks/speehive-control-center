import { DashboardShell } from "@/components/DashboardShell";

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
  const sp = await searchParams;

  return <DashboardShell searchParams={sp} />;
}
