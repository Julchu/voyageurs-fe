import { NextResponse } from "next/server";
import { backendUrl } from "@/utils/env";
import { getAccessToken } from "@/utils/server-actions/session-token";

type BackendPayload = {
  success?: boolean;
  data?: unknown;
  error?: string;
};

export const proxyJson = async (path: string, init: RequestInit | undefined, dataKey: string) => {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${backendUrl()}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as BackendPayload;
  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error ?? "Request failed" },
      { status: response.status },
    );
  }

  return NextResponse.json({ [dataKey]: payload.data ?? null }, { status: response.status });
};
