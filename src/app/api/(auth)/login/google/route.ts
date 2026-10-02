import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  oauthCookieClearOptions,
} from "@/utils/server-actions/oauth";

const finishLogin = (req: NextRequest, failed: boolean) => {
  const base = process.env.VOYAGEURS_BASE_URL ?? req.nextUrl.origin;
  const destination = new URL(failed ? "/?login=failed" : "/", base);
  const response = NextResponse.redirect(destination);
  const clearOptions = oauthCookieClearOptions();
  response.cookies.set(OAUTH_STATE_COOKIE, "", clearOptions);
  response.cookies.set(OAUTH_VERIFIER_COOKIE, "", clearOptions);
  return response;
};

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");
  const jar = await cookies();
  const expectedState = jar.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = jar.get(OAUTH_VERIFIER_COOKIE)?.value;

  if (
    oauthError ||
    !code ||
    !state ||
    !expectedState ||
    !codeVerifier ||
    state !== expectedState
  ) {
    return finishLogin(req, true);
  }

  try {
    const loginResponse = await fetch(
      `${process.env.VOYAGEURS_BACKEND_URL}/user/login/google`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, codeVerifier }),
        cache: "no-store",
      },
    );

    if (!loginResponse.ok) return finishLogin(req, true);

    const response = finishLogin(req, false);
    for (const cookie of loginResponse.headers.getSetCookie()) {
      response.headers.append("Set-Cookie", cookie);
    }
    return response;
  } catch (error) {
    console.error(
      "Google login callback failed",
      error instanceof Error ? error.name : "unknown",
    );
    return finishLogin(req, true);
  }
}