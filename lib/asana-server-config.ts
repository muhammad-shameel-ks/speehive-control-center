import { getSession } from "@/lib/session";

export type AsanaServerConfig = {
  clientId: string;
  clientSecret: string;
};

export async function getAsanaServerConfig(): Promise<AsanaServerConfig | null> {
  const envId = process.env.ASANA_CLIENT_ID;
  const envSecret = process.env.ASANA_CLIENT_SECRET;
  if (envId && envSecret) {
    return { clientId: envId, clientSecret: envSecret };
  }
  const { data } = await getSession();
  if (data.clientId && data.clientSecret) {
    return { clientId: data.clientId, clientSecret: data.clientSecret };
  }
  return null;
}
