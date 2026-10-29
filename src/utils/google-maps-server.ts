import { NextResponse } from "next/server";

/**
 * Server-side Google Maps Platform proxy helper.
 *
 * The key lives in `GOOGLE_MAPS_API_KEY` (server-only, never `NEXT_PUBLIC_`) so
 * it is never shipped to the browser. The caller supplies the Google endpoint
 * and a field mask; the mask is the primary cost lever for the Places API (New)
 * — pinning it here (not on the client) keeps request shape and billing tier
 * under our control. Responses are forwarded verbatim; mapping to app types
 * happens in the client adapters.
 */
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const googleProxy = async (
  url: string,
  fieldMask: string | undefined,
  init?: RequestInit,
): Promise<NextResponse> => {
  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: "Missing GOOGLE_MAPS_API_KEY" },
      { status: 500 },
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
    ...(fieldMask ? { "X-Goog-FieldMask": fieldMask } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  try {
    const response = await fetch(url, { ...init, headers, cache: "no-store" });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream request failed" },
      { status: 502 },
    );
  }
};
