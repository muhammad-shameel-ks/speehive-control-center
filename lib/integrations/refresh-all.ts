export type RefreshAllInput = {
  refreshOutlookMail: () => Promise<unknown>;
  refreshTeams: () => Promise<unknown>;
  refreshAsana: () => Promise<unknown>;
};

export async function refreshAllIntegrations({
  refreshOutlookMail,
  refreshTeams,
  refreshAsana,
}: RefreshAllInput): Promise<void> {
  await Promise.all([refreshOutlookMail(), refreshTeams(), refreshAsana()]);
}
