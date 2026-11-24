import { NextRequest, NextResponse } from "next/server";
import { backendRequest, forwardedFor } from "@/server/backend";
import { cookieBase } from "@/server/cookies";
import { env } from "@/server/env";
import { getAccessToken, getRefreshToken } from "@/server/session-token";

export async function POST(req: NextRequest) {
  let status = 200;

  try {
    const headers = new Headers(forwardedFor(req));
    const refreshToken = await getRefreshToken();
    if (refreshToken) headers.set("X-Refresh-Token", refreshToken);

    const backendResponse = await backendRequest("user/logout", {
      method: "POST",
      token: await getAccessToken(),
      headers,
    });

    if (!backendResponse.ok) {
      console.error("Backend logout failed", backendResponse.status);
      status = 502;
    }
  } catch (error) {
    console.error(
      "Logout failed",
      error instanceof Error ? error.name : "unknown",
    );
    status = 503;
  }

  const response = NextResponse.json({ userInfo: null }, { status });
  const { accessKey, refreshKey } = env();
  for (const name of [accessKey, refreshKey]) {
    response.cookies.set(name, "", { ...cookieBase, maxAge: 0 });
  }
  return response;
}
