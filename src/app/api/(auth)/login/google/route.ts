import { NextRequest, NextResponse } from "next/server";
import { backendRequest, forwardedFor } from "@/server/backend";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  oauthCookieClearOptions,
} from "@/server/oauth";

const finishLogin = (req: NextRequest, failed: boolean) => {
  const base = process.env.VOYAGEURS_BASE_URL ?? req.nextUrl.origin;

  // ?login=failed query param for showing “Sign-in failed” msg if needed
  // const destination = new URL(failed ? "/?login=failed" : "/", base);
  const destination = new URL(failed ? "/" : "/", base);
  const response = NextResponse.redirect(destination);
  response.cookies.set(OAUTH_STATE_COOKIE, "", oauthCookieClearOptions);
  response.cookies.set(OAUTH_VERIFIER_COOKIE, "", oauthCookieClearOptions);
  return response;
};

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");
  const expectedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = req.cookies.get(OAUTH_VERIFIER_COOKIE)?.value;

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
    const loginResponse = await backendRequest("user/login/google", {
      method: "POST",
      headers: forwardedFor(req),
      body: JSON.stringify({ code, codeVerifier }),
    });

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
