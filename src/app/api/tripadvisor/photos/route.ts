import { NextRequest, NextResponse } from "next/server";
import {
  TripadvisorError,
  fetchLocationPhotos,
  fetchLocationWebUrl,
  findLocation,
  hasTripadvisorKey,
} from "@/utils/tripadvisor-server";
import { normalizePlaceName } from "@/utils/place-name";

/**
 * Tripadvisor photos for a clicked POI: `?name=&lat=&lon=&mapboxId=`.
 *
 * Only Tripadvisor location ids (or "no match") are cached, which the Terra
 * caching policy allows; photos and the link-back URL are fetched live and the
 * response is `no-store`. The cache is per server instance — move it to the
 * backend if it needs to survive restarts.
 */
const MAX_CACHE_ENTRIES = 5000;
const locationIds = new Map<string, number | null>();
const pending = new Map<
  string,
  Promise<{ id: number; webUrl?: string } | null>
>();

const remember = (key: string, id: number | null) => {
  if (locationIds.size >= MAX_CACHE_ENTRIES) {
    const oldest = locationIds.keys().next().value;
    if (oldest !== undefined) locationIds.delete(oldest);
  }
  locationIds.set(key, id);
};

const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export const GET = async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const name = params.get("name")?.trim().slice(0, 200) ?? "";
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const mapboxId = params.get("mapboxId")?.slice(0, 200) || undefined;

  if (
    !name ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return NextResponse.json({ error: "Invalid place" }, { status: 400 });
  }
  if (!hasTripadvisorKey()) {
    return NextResponse.json(
      { error: "Missing TRIPADVISOR_API_KEY" },
      { status: 500 },
    );
  }

  const key =
    mapboxId ??
    `${normalizePlaceName(name)}:${lat.toFixed(4)}:${lon.toFixed(4)}`;

  try {
    let id = locationIds.get(key);
    let webUrl: string | undefined;

    if (id === undefined) {
      // Dedupe concurrent lookups for the same POI (e.g. Strict Mode remounts).
      let lookup = pending.get(key);
      if (!lookup) {
        lookup = findLocation({ name, lat, lon }).finally(() =>
          pending.delete(key),
        );
        pending.set(key, lookup);
      }
      const match = await lookup;
      id = match?.id ?? null;
      webUrl = match?.webUrl;
      remember(key, id);
    }

    if (id === null) {
      return NextResponse.json({ photos: [] }, { headers: noStore });
    }

    const [photos, tripadvisorUrl] = await Promise.all([
      fetchLocationPhotos(id),
      webUrl ?? fetchLocationWebUrl(id),
    ]);
    return NextResponse.json({ photos, tripadvisorUrl }, { headers: noStore });
  } catch (error) {
    const status =
      error instanceof TripadvisorError && error.status < 500
        ? error.status
        : 502;
    return NextResponse.json(
      { error: "Tripadvisor lookup failed" },
      { status, headers: noStore },
    );
  }
};
