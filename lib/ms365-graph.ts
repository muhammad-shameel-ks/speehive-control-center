const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export const MS365_PANEL_IDS = ["outlook-mail", "teams-chat"] as const;
export type Ms365PanelId = (typeof MS365_PANEL_IDS)[number];

export type Ms365Panel = {
  label: string;
  fetchFn: (accessToken: string, opts?: { skip?: number }) => Promise<unknown>;
};

export const MS365_PANELS: Record<Ms365PanelId, Ms365Panel> = {
  "outlook-mail": {
    label: "Show my recent inbox",
    fetchFn: fetchRecentMail,
  },
  "teams-chat": {
    label: "Show my recent Teams chats",
    fetchFn: fetchRecentChats,
  },
};

async function graphGet(
  path: string,
  accessToken: string,
  extraHeaders?: Record<string, string>,
): Promise<unknown> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API error (${res.status}): ${text}`);
  }

  return res.json();
}

async function fetchRecentMail(
  accessToken: string,
  opts?: { skip?: number },
): Promise<unknown> {
  const skip = opts?.skip ?? 0;
  const skipParam = skip > 0 ? `&$skip=${skip}` : "";
  return graphGet(
    `/me/mailFolders/inbox/messages?$top=25${skipParam}&$orderby=receivedDateTime%20desc&$select=subject,from,receivedDateTime,bodyPreview,body,isRead,webLink`,
    accessToken,
  );
}

async function fetchRecentChats(
  accessToken: string,
  _opts?: { skip?: number },
): Promise<unknown> {
  void _opts;
  const chatsData = await graphGet(
    "/me/chats?$top=15&$orderby=lastMessagePreview%2FcreatedDateTime%20desc&$expand=lastMessagePreview,members",
    accessToken,
  ) as { value?: Array<{ id?: string }> };

  const chats = chatsData?.value ?? [];

  const chatsWithMessages = await Promise.all(
    chats.map(async (chat) => {
      if (!chat.id) return { ...chat, messages: [] };
      try {
        const msgs = await graphGet(
          `/me/chats/${chat.id}/messages?$top=20&$orderby=lastModifiedDateTime%20desc&$select=from,body,createdDateTime,messageType`,
          accessToken,
          { "Prefer": "include-unknown-enum-members" },
        ) as { value?: unknown[] };
        return { ...chat, messages: msgs?.value ?? [] };
      } catch {
        return { ...chat, messages: [] };
      }
    })
  );

  return { value: chatsWithMessages };
}
