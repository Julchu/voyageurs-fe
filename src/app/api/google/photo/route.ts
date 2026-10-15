import { NextRequest, NextResponse } from "next/server";

/**
 * Place Photo (New) proxy for `next/image`.
 *
 * The client `src` is this route (`?name=<photo resource name>&w=<px>`). The
 * image optimizer loads that path internally and only accepts a 2xx image
 * body — it does not follow redirects — so we resolve the media URL here and
 * return the bytes. The API key stays on the server. The Photo SKU is billed
 * per upstream fetch; callers only build URLs for photos they render.
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

    // Fetch the CDN URL without the API key. `photoUri` is short-lived, so
    // this response is not cached here; `next/image` caches the optimized result.
    const image = await fetch(body.photoUri, { cache: "no-store" });
    if (!image.ok) {
      return NextResponse.json(
        { error: "Photo lookup failed" },
        { status: image.status },
      );
    }
    const contentType = image.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Photo lookup failed" }, { status: 502 });
    }

    return new NextResponse(await image.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream request failed" },
      { status: 502 },
    );
  }
};
