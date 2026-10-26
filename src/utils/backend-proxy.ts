import { NextResponse } from "next/server";
import { getAccessToken } from "@/utils/server-actions/session-token";

type BackendPayload = {
  success?: boolean;
  data?: unknown;
  error?: string;
};

export const proxyJson = async (
  path: string,
  init?: RequestInit,
) => {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const response = await fetch(`${process.env.VOYAGEURS_BACKEND_URL}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as BackendPayload;
  if (!response.ok || !payload.success) {
    return NextResponse.json(
      { error: payload.error ?? "Request failed" },
      { status: response.status },
    );
  }

  return NextResponse.json(
    payload.data,
    { status: response.status },
  );
};
