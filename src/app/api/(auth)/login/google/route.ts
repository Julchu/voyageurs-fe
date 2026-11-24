import { NextRequest, NextResponse } from "next/server";
import { backendRequest, forwardedFor } from "@/server/backend";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  oauthCookieClearOptions,
} from "@/server/oauth";

// TODO: send failed logins to "/?login=failed" and show a "Sign-in failed" message.
const finishLogin = (req: NextRequest) => {
  const base = process.env.VOYAGEURS_BASE_URL ?? req.nextUrl.origin;
  const response = NextResponse.redirect(new URL("/", base));
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
    return finishLogin(req);
  }

  try {
    const loginResponse = await backendRequest("user/login/google", {
      method: "POST",
      headers: forwardedFor(req),
      body: JSON.stringify({ code, codeVerifier }),
    });

    if (!loginResponse.ok) return finishLogin(req);

    const response = finishLogin(req);
    for (const cookie of loginResponse.headers.getSetCookie()) {
      response.headers.append("Set-Cookie", cookie);
    }
    return response;
  } catch (error) {
    console.error(
      "Google login callback failed",
      error instanceof Error ? error.name : "unknown",
    );
    return finishLogin(req);
  }
}
