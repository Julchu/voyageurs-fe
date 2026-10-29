import { NextRequest, NextResponse } from "next/server";

/**
 * Resolve a photo without exposing the server key. Unoptimized images follow
 * the redirect straight to Google's CDN, avoiding a second server fetch.
 * Neither photo resource names nor the redirect are durably cached.
 */
export const GET = async (request: NextRequest) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const name = request.nextUrl.searchParams.get("name");
  const rawWidth = Number(request.nextUrl.searchParams.get("w") ?? 800);
  const width = String(
    Math.min(4800, Math.max(1, Number.isFinite(rawWidth) ? rawWidth : 800)),
  );

  if (!key) {
    return NextResponse.json(
      { error: "Missing GOOGLE_MAPS_API_KEY" },
      { status: 500 },
    );
  }
  // `name` is a Google-issued resource path like `places/XX/photos/YY`.
  if (!name || !/^places\/[^/]+\/photos\/[^/]+$/.test(name)) {
    return NextResponse.json({ error: "Invalid photo name" }, { status: 400 });
  }

  const upstream = new URL(`https://places.googleapis.com/v1/${name}/media`);
  upstream.searchParams.set("maxWidthPx", width);
  upstream.searchParams.set("skipHttpRedirect", "true");

  try {
    const meta = await fetch(upstream, {
      headers: { "X-Goog-Api-Key": key },
      cache: "no-store",
      signal: request.signal,
    });
    if (!meta.ok) {
      return NextResponse.json(
        { error: "Photo lookup failed" },
        { status: meta.status },
      );
    }
    const body = (await meta.json()) as { photoUri?: string };
    if (!body.photoUri) {
      return NextResponse.json({ error: "No photo" }, { status: 404 });
    }

    if (new URL(body.photoUri).protocol !== "https:") {
      return NextResponse.json(
        { error: "Photo lookup failed" },
        { status: 502 },
      );
    }
    return NextResponse.redirect(body.photoUri, {
      status: 307,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream request failed" },
      { status: 502 },
    );
  }
};
