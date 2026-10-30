import { NextResponse } from "next/server";
import {
  getAccessToken,
  getRefreshToken,
  sessionCookieClearOptions,
} from "@/utils/server-actions/session-token";

export async function POST() {
  let status = 200;

  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    const backendResponse = await fetch(
      `${process.env.VOYAGEURS_BACKEND_URL}/user/logout`,
      {
        method: "POST",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(refreshToken ? { "X-Refresh-Token": refreshToken } : {}),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

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
  const clearOptions = sessionCookieClearOptions();
  const accessKey = process.env.ACCESS_TOKEN_KEY;
  const refreshKey = process.env.REFRESH_TOKEN_KEY;
  if (accessKey) response.cookies.set(accessKey, "", clearOptions);
  if (refreshKey) response.cookies.set(refreshKey, "", clearOptions);
  return response;
}
