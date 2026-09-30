import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/utils/env";

const accessTokenStale = (token: string) => {
  try {
    const part = token.split(".")[1];
    if (!part) return true;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now() + 30_000;
  } catch {
    return true;
  }
};

const setCookiePair = (setCookie: string) => {
  const pair = setCookie.split(";", 1)[0] ?? "";
  const eq = pair.indexOf("=");
  if (eq <= 0) return;
  const name = pair.slice(0, eq).trim();
  const value = pair.slice(eq + 1).trim();
  if (!name || !value) return;
  return { name, value };
};

const replaceCookie = (cookieHeader: string, name: string, value: string) => {
  const parts = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${name}=`));
  parts.push(`${name}=${value}`);
  return parts.join("; ");
};

const removeCookie = (cookieHeader: string, name: string) =>
  cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${name}=`))
    .join("; ");

export async function proxy(req: NextRequest) {
  const accessTokenKey = process.env.ACCESS_TOKEN_KEY;
  const refreshTokenKey = process.env.REFRESH_TOKEN_KEY;
  const accessToken = accessTokenKey ? req.cookies.get(accessTokenKey)?.value : undefined;
  const refreshToken = refreshTokenKey ? req.cookies.get(refreshTokenKey)?.value : undefined;

  let requestCookie = req.headers.get("cookie") ?? "";
  const setCookies: string[] = [];

  const shouldRefresh =
    Boolean(refreshToken) &&
    (!accessToken || accessTokenStale(accessToken)) &&
    !req.nextUrl.pathname.startsWith("/api/login");

  if (shouldRefresh && accessTokenKey && refreshTokenKey && refreshToken) {
    try {
      const refreshRes = await fetch(`${backendUrl()}/user/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
        cache: "no-store",
      });

      if (refreshRes.ok) {
        for (const cookie of refreshRes.headers.getSetCookie()) {
          setCookies.push(cookie);
          const pair = setCookiePair(cookie);
          if (!pair) continue;
          if (pair.name === accessTokenKey || pair.name === refreshTokenKey) {
            requestCookie = replaceCookie(requestCookie, pair.name, pair.value);
          }
        }
      } else if (refreshRes.status === 401) {
        requestCookie = removeCookie(requestCookie, accessTokenKey);
        requestCookie = removeCookie(requestCookie, refreshTokenKey);
        const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
        setCookies.push(
          `${accessTokenKey}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
          `${refreshTokenKey}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
        );
      }
    } catch (error) {
      console.error("Session refresh failed", error instanceof Error ? error.name : "unknown");
    }
  }

  const requestHeaders = new Headers(req.headers);
  if (requestCookie) requestHeaders.set("cookie", requestCookie);
  else requestHeaders.delete("cookie");

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("X-Current-Path", req.nextUrl.pathname);

  for (const cookie of setCookies) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/).*)"],
};
