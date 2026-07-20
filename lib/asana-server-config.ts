export type AsanaServerConfig = {
  clientId: string;
  clientSecret: string;
};

export function getAsanaServerConfig(): AsanaServerConfig | null {
  const envId = process.env.ASANA_CLIENT_ID;
  const envSecret = process.env.ASANA_CLIENT_SECRET;
  if (envId && envSecret) {
    return { clientId: envId, clientSecret: envSecret };
  }
  return null;
}
