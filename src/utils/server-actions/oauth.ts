export const OAUTH_STATE_COOKIE = "voyageurs_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "voyageurs_oauth_verifier";
export const OAUTH_COOKIE_PATH = "/api/login";
const OAUTH_COOKIE_MAX_AGE = 10 * 60;

export const oauthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: OAUTH_COOKIE_PATH,
  maxAge: OAUTH_COOKIE_MAX_AGE,
});

export const oauthCookieClearOptions = () => ({
  ...oauthCookieOptions(),
  maxAge: 0,
});

export const googleRedirectUri = (requestUrl: string) => {
  const configured = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URIS;
  const base =
    process.env.VOYAGEURS_BASE_URL ?? process.env.TEAWORK_BASE_URL ?? new URL(requestUrl).origin;
  if (!configured) return;

  try {
    const uri = new URL(configured);
    if (uri.origin !== new URL(base).origin) return;
    if (uri.pathname !== "/api/login/google") return;
    return uri.toString();
  } catch {
    return;
  }
};
