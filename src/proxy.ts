import { NextRequest, NextResponse } from "next/server";
import { backendRequest } from "@/server/backend";
import { env } from "@/server/env";

/** Stale unless the token names its session and has more than 30s left. */
const accessTokenStale = (token: string) => {
  try {
    const { sid, exp } = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString(),
    ) as { sid?: unknown; exp?: unknown };
    return (
      typeof sid !== "string" ||
      typeof exp !== "number" ||
      exp * 1000 <= Date.now() + 30_000
    );
  } catch {
    return true;
  }
};

const isAuthRoute = (path: string) =>
  path.startsWith("/api/login") || path === "/api/logout";

export async function proxy(req: NextRequest) {
  const { accessKey, refreshKey } = env();
  const refreshToken = req.cookies.get(refreshKey)?.value;
  const accessToken = req.cookies.get(accessKey)?.value;
  if (
    !refreshToken ||
    (accessToken && !accessTokenStale(accessToken)) ||
    isAuthRoute(req.nextUrl.pathname)
  ) {
    return NextResponse.next();
  }

  const refreshed = await backendRequest("user/refresh", {
    method: "POST",
    token: refreshToken,
  }).catch((error: unknown) =>
    console.error(
      "Session refresh failed",
      error instanceof Error ? error.name : "unknown",
    ),
  );
  // Timeout, 5xx or 429: keep the current cookies and let the request through.
  if (!refreshed || (!refreshed.ok && refreshed.status !== 401)) {
    return NextResponse.next();
  }

  // The BE sets both tokens on 200 and clears both on 401; this request sees the same.
  const { cookies } = new NextResponse(null, { headers: refreshed.headers });
  for (const { name, value } of cookies.getAll()) {
    if (value) req.cookies.set(name, value);
    else req.cookies.delete(name);
  }
  const response = NextResponse.next({ request: { headers: req.headers } });
  for (const setCookie of refreshed.headers.getSetCookie()) {
    response.headers.append("Set-Cookie", setCookie);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/).*)",
  ],
};
