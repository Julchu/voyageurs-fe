import "server-only";
import { NextResponse } from "next/server";
import { getAccessToken } from "@/server/session-token";

const BACKEND_TIMEOUT_MS = 5000;

type BackendResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

/** One place that calls the backend: adds the token, timeout and reads the { success, data, error } envelope. */
const backendFetch = async <T>(
  path: string,
  init?: RequestInit,
): Promise<BackendResult<T>> => {
  const token = await getAccessToken();
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body) headers.set("Content-Type", "application/json");

  try {
    const response = await fetch(
      `${process.env.VOYAGEURS_BACKEND_URL}/${path}`,
      {
        ...init,
        headers,
        signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
      },
    );
    const { success, data, error } = await response.json();
    const ok = response.ok && Boolean(success);

    return {
      ok,
      status: response.status,
      data: data as T,
      error: ok ? undefined : (error ?? "Request failed"),
    };
  } catch (error) {
    console.error("Backend fetch failed", path, error);
    return { ok: false, status: 502, error: "Backend unavailable" };
  }
};

/** For server components: returns the data, or null on any failure. */
export const serverFetch = async <T>(
  endpoint: "user" | "trips" | "searches",
): Promise<T | null> => {
  const result = await backendFetch<T>(endpoint);
  // TODO: tell "logged out" apart from "backend down" so an outage doesn't look like a logout
  return result.ok ? (result.data as T) : null;
};

/** A BFF route's response: the backend's data, or `{ error }`, with its status. */
export const proxyJson = async (path: string, init?: RequestInit) => {
  const result = await backendFetch(path, init);
  return NextResponse.json(result.ok ? result.data : { error: result.error }, {
    status: result.status,
  });
};
