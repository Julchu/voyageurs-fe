import type { Coordinates } from "@/types/place";

export type Params = Record<string, string | number | undefined>;

export type SearchOptions = {
  limit?: number;
  /** Comma-separated feature types; defaults to broad search. */
  types?: string;
  proximity?: Coordinates;
  signal?: AbortSignal;
};

/** GET a Mapbox API path with the public token. Throws on a failed response. */
export const mapboxGet = async <T>(
  path: string,
  params: Params,
  signal?: AbortSignal,
): Promise<T> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) throw new Error("Mapbox token is missing");

  const url = new URL(path, "https://api.mapbox.com");
  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(params))
    if (value !== undefined) url.searchParams.set(key, String(value));

  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(`Mapbox request failed (${response.status})`);
  return response.json() as Promise<T>;
};

export const searchParams = ({
  limit = 5,
  types,
  proximity,
}: SearchOptions) => ({
  limit,
  types,
  proximity: proximity && `${proximity.lng},${proximity.lat}`,
});
