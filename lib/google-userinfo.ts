const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Userinfo fetch failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as Partial<GoogleUserInfo>;
  if (!json.sub || !json.email) {
    throw new Error("Userinfo response missing sub or email");
  }
  return {
    sub: json.sub,
    email: json.email,
    email_verified: json.email_verified,
    name: json.name,
    picture: json.picture,
  };
}
