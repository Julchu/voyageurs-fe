import "server-only";
import { NextResponse } from "next/server";
import { env } from "@/server/env";
import { getAccessToken } from "@/server/session-token";
import type { TripDto } from "@/types/trip-api";
import type { PlaceSearch } from "@/types/place";
import type { UserInfo } from "@/types/user";

const BACKEND_TIMEOUT_MS = 5000;

/** A backend request with a timeout, plus the bearer token and JSON content type when given. */
export const backendRequest = (
  path: string,
  { token, ...init }: RequestInit & { token?: string } = {},
) => {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");
  return fetch(`${env().backendUrl}/${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
  });
};

// The BE's login/logout IP limiter keys on this only once TRUST_PROXY=1 is set on the BE.
export const forwardedFor = (req: Request): Record<string, string> => {
  const chain = req.headers.get("x-forwarded-for");
  return chain ? { "X-Forwarded-For": chain } : {};
};

type BackendResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; error: string };

/** Calls the backend as the signed-in user and reads its `{ success, data, error }` envelope. */
const backendFetch = async (
  path: string,
  init?: RequestInit,
): Promise<BackendResult> => {
  const token = await getAccessToken();
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };

  try {
    const response = await backendRequest(path, { ...init, token });
    const { success, data, error } = (await response.json()) as {
      success?: unknown;
      data?: unknown;
      error?: unknown;
    };
    return response.ok && success
      ? { ok: true, status: response.status, data }
      : {
          ok: false,
          status: response.status,
          error: typeof error === "string" ? error : "Request failed",
        };
  } catch (error) {
    console.error("Backend fetch failed", path, error);
    return { ok: false, status: 502, error: "Backend unavailable" };
  }
};

/** A BFF route's response: the backend's data, or `{ error }`, with its status. */
export const proxyJson = async (path: string, init?: RequestInit) => {
  const result = await backendFetch(path, init);
  return NextResponse.json(result.ok ? result.data : { error: result.error }, {
    status: result.status,
  });
};

type ServerData = { user: UserInfo; trips: TripDto[]; searches: PlaceSearch[] };

/** For server components: the data, or null on any failure. */
export const serverFetch = async <K extends keyof ServerData>(
  key: K,
): Promise<ServerData[K] | null> => {
  const result = await backendFetch(key);
  // TODO: tell "logged out" apart from "backend down" so an outage doesn't look like a logout
  // shortcut: trusts the backend's shape for each key; parse here if it drifts.
  return result.ok ? (result.data as ServerData[K]) : null;
};
