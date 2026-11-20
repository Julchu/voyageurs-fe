import "server-only";
import { NextResponse } from "next/server";
import { backendFetch } from "@/server/backend";

export const proxyJson = async (path: string, init?: RequestInit) => {
  const result = await backendFetch(path, init);

  return NextResponse.json(result.ok ? result.data : { error: result.error }, {
    status: result.status,
  });
};
