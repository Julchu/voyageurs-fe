import "server-only";
import { cookies } from "next/headers";
import { env } from "@/server/env";

/**
 * Prefer the real session cookie. MASTER_KEY is only a development fallback
 * when no session cookie is present, and never outside development.
 */
export const getAccessToken = async () => {
  const jar = await cookies();
  const session = jar.get(env().accessKey)?.value;
  if (session) return session;

  if (process.env.NODE_ENV === "development" && process.env.MASTER_KEY) {
    return process.env.MASTER_KEY;
  }

  return undefined;
};

export const getRefreshToken = async () =>
  (await cookies()).get(env().refreshKey)?.value;
