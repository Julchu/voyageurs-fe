import { NextRequest, NextResponse } from "next/server";
import { backendRequest, forwardedFor } from "@/server/backend";
import { cookieBase } from "@/server/cookies";
import { env } from "@/server/env";
import { getAccessToken, getRefreshToken } from "@/server/session-token";

/** Ends the backend session. The status to answer with: 200, or why it failed. */
const backendLogout = async (req: NextRequest) => {
  try {
    const headers = new Headers(forwardedFor(req));
    const refreshToken = await getRefreshToken();
    if (refreshToken) headers.set("X-Refresh-Token", refreshToken);

    const backendResponse = await backendRequest("user/logout", {
      method: "POST",
      token: await getAccessToken(),
      headers,
    });
    if (backendResponse.ok) return 200;
    console.error("Backend logout failed", backendResponse.status);
    return 502;
  } catch (error) {
    console.error(
      "Logout failed",
      error instanceof Error ? error.name : "unknown",
    );
    return 503;
  }
};

export async function POST(req: NextRequest) {
  const status = await backendLogout(req);
  // Cookies clear even when the backend fails, so the browser is signed out.
  const response = NextResponse.json({ userInfo: null }, { status });
  const { accessKey, refreshKey } = env();
  for (const name of [accessKey, refreshKey]) {
    response.cookies.set(name, "", { ...cookieBase, maxAge: 0 });
  }
  return response;
}
