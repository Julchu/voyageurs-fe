import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/utils/env";
import { getAccessToken } from "@/utils/server-actions/session-token";
import {
  googleRedirectUri,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  oauthCookieOptions,
} from "@/utils/server-actions/oauth";

const base64url = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");

export async function GET(req: NextRequest) {
  const redirectUri = googleRedirectUri(req.url);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!redirectUri || !clientId) {
    return new Response("OAuth redirect is not configured", { status: 500 });
  }

  const state = crypto.randomUUID();
  const codeVerifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = base64url(new Uint8Array(digest));

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("state", state);
  googleUrl.searchParams.set("code_challenge", codeChallenge);
  googleUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(googleUrl);
  const cookieOptions = oauthCookieOptions();
  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(OAUTH_VERIFIER_COOKIE, codeVerifier, cookieOptions);
  return response;
}

export async function POST() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ userInfo: null });
    }

    const loginResponse = await fetch(`${backendUrl()}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { success, data } = await loginResponse.json();
    if (!success) {
      return NextResponse.json({ userInfo: null }, { status: loginResponse.status });
    }

    return NextResponse.json({ userInfo: data });
  } catch (error) {
    console.error("Failed to load session", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ userInfo: null }, { status: 500 });
  }
}
