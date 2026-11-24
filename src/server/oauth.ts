import "server-only";
import { cookieBase } from "@/server/cookies";

export const OAUTH_STATE_COOKIE = "voyageurs_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "voyageurs_oauth_verifier";

export const oauthCookieOptions = {
  ...cookieBase,
  path: "/api/login",
  maxAge: 10 * 60,
};

export const oauthCookieClearOptions = { ...oauthCookieOptions, maxAge: 0 };

export const googleRedirectUri = (requestUrl: string) => {
  const configured = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URIS;
  const base = process.env.VOYAGEURS_BASE_URL ?? new URL(requestUrl).origin;
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
