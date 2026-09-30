import { cookies } from "next/headers";

const sessionCookieBase = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});

export const sessionCookieClearOptions = () => ({
  ...sessionCookieBase(),
  maxAge: 0,
});

/**
 * Prefer the real session cookie. MASTER_KEY is only a development fallback
 * when no session cookie is present, and never outside development.
 */
export const getAccessToken = async () => {
  const key = process.env.ACCESS_TOKEN_KEY;
  const jar = await cookies();
  const session = key ? jar.get(key)?.value : undefined;
  if (session) return session;

  if (process.env.NODE_ENV === "development" && process.env.MASTER_KEY) {
    return process.env.MASTER_KEY;
  }

  return undefined;
};

export const getRefreshToken = async () => {
  const key = process.env.REFRESH_TOKEN_KEY;
  if (!key) return undefined;
  const jar = await cookies();
  return jar.get(key)?.value;
};
