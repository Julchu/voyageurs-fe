import { NextResponse } from "next/server";
import { backendUrl } from "@/utils/env";
import {
  getAccessToken,
  getRefreshToken,
  sessionCookieClearOptions,
} from "@/utils/server-actions/session-token";

export async function POST() {
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    await fetch(`${backendUrl()}/user/logout`, {
      method: "POST",
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(refreshToken ? { "X-Refresh-Token": refreshToken } : {}),
      },
      cache: "no-store",
    });

    const response = NextResponse.json({ userInfo: null });
    const clearOptions = sessionCookieClearOptions();
    const accessKey = process.env.ACCESS_TOKEN_KEY;
    const refreshKey = process.env.REFRESH_TOKEN_KEY;
    if (accessKey) response.cookies.set(accessKey, "", clearOptions);
    if (refreshKey) response.cookies.set(refreshKey, "", clearOptions);
    return response;
  } catch (error) {
    console.error("Logout failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ userInfo: null }, { status: 500 });
  }
}
