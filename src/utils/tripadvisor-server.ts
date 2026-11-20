import "server-only";
import { normalizePlaceName } from "@/utils/place-name";

/**
 * Tripadvisor Terra API (https://docs.terra.tripadvisor.com) — server only.
 *
 * Billing: search/nearby bill one entity per location returned, photos and
 * details one per call. Caching policy: only the location `id` may be stored;
 * photos, URLs and ratings must be fetched live and never re-hosted.
 */
const BASE = "https://terra.tripadvisor.com/api";
const KEY = process.env.TRIPADVISOR_API_KEY;

/** Max distance (km) a nearby candidate may be from the clicked POI. */
const NEARBY_RADIUS_KM = 0.2;
/** Each returned location is billed; keep this small. */
const NEARBY_SIZE = 5;
const PHOTO_SIZE = 5;

type TerraName = { language?: string; primary?: boolean; value: string };
type TerraLocation = {
  id: number;
  names?: TerraName[];
  urls?: { tripadvisor?: { main?: string } };
};
type TerraNearbyItem = { location: TerraLocation; distance_kilometers: number };
type TerraPhotoItem = {
  photo?: {
    original_size_url?: string;
    original_width?: number;
    original_height?: number;
  };
  user?: { username?: string };
};

export type TripadvisorPhoto = {
  url: string;
  width: number | null;
  height: number | null;
  author?: string;
};

export class TripadvisorError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const hasTripadvisorKey = () => Boolean(KEY);

const terraGet = async <T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T> => {
  if (!KEY) throw new TripadvisorError("Missing TRIPADVISOR_API_KEY", 500);
  const url = new URL(`${BASE}${path}`);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, String(value));
  }
  const response = await fetch(url, {
    headers: { "X-API-Key": KEY, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new TripadvisorError(`Tripadvisor ${path} failed`, response.status);
  }
  return (await response.json()) as T;
};

/**
 * Find the Tripadvisor location for a clicked POI. Matches by name within a
 * small radius — never by proximity alone, so a neighbor's photos can't leak in.
 */
export const findLocation = async ({
  name,
  lat,
  lon,
}: {
  name: string;
  lat: number;
  lon: number;
}): Promise<{ id: number; webUrl?: string } | null> => {
  const target = normalizePlaceName(name);
  if (!target) return null;

  const { data } = await terraGet<{ data?: TerraNearbyItem[] }>(
    "/locations/nearby",
    {
      lat,
      lon,
      radius: NEARBY_RADIUS_KM,
      unit: "KM",
      sort: "distance,asc",
      size: NEARBY_SIZE,
    },
  );

  const nameMatches = (location: TerraLocation) =>
    (location.names ?? []).some(({ value }) => {
      const candidate = normalizePlaceName(value);
      if (candidate === target) return true;
      // Allow "Louvre" vs "Musée du Louvre"-style differences only when the
      // shorter name is distinctive enough.
      const [short, long] =
        candidate.length < target.length
          ? [candidate, target]
          : [target, candidate];
      return short.length >= 5 && long.includes(short);
    });

  // `data` is sorted by distance, so the first name match is the closest.
  const match = data?.find(({ location }) => nameMatches(location));
  if (!match) return null;
  return {
    id: match.location.id,
    webUrl: match.location.urls?.tripadvisor?.main,
  };
};

export const fetchLocationWebUrl = async (id: number) => {
  const location = await terraGet<TerraLocation>(`/locations/${id}`);
  return location.urls?.tripadvisor?.main;
};

export const fetchLocationPhotos = async (
  id: number,
): Promise<TripadvisorPhoto[]> => {
  const { data } = await terraGet<{ data?: TerraPhotoItem[] }>(
    `/locations/${id}/photos`,
    { page: 1, size: PHOTO_SIZE },
  );
  return (data ?? []).flatMap(({ photo, user }) =>
    photo?.original_size_url?.startsWith("https://")
      ? [
          {
            url: photo.original_size_url,
            width: photo.original_width ?? null,
            height: photo.original_height ?? null,
            author: user?.username,
          },
        ]
      : [],
  );
};
