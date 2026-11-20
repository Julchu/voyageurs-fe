import type { Place } from "@/utils/interfaces";
import type { MapboxSearchResponse, MapboxSuggestion } from "@/types/mapbox";
import {
  mapboxGet,
  searchParams,
  type Params,
  type SearchOptions,
} from "./mapbox-api";
import { placeFromSearch, suggestionFrom } from "./mapbox-place-parsing";

/* Address bar: Search Box /suggest while typing, then /retrieve on pick. */

export type SearchSuggestion = {
  mapboxId: string;
  name: string;
  featureType: string;
  streetAddress: string;
  areaAddress: string;
  category: string;
};

/** One billed session groups `/suggest` calls with the `/retrieve` that ends it. */
type SessionOptions = { sessionToken: string; signal?: AbortSignal };

export const createSearchBoxSessionToken = (): string => crypto.randomUUID();

/** Address bar type-ahead. Suggestions have no coordinates until retrieved. */
export const searchBoxSuggest = async (
  query: string,
  { sessionToken, signal, ...options }: SessionOptions & SearchOptions,
): Promise<SearchSuggestion[]> => {
  const q = query.trim();
  if (!q || !sessionToken) return [];
  const body = await mapboxGet<{ suggestions?: MapboxSuggestion[] }>(
    "/search/searchbox/v1/suggest",
    { q, session_token: sessionToken, ...searchParams(options) },
    signal,
  );
  return (body.suggestions ?? []).flatMap((item) => suggestionFrom(item) ?? []);
};

/** The full place for a suggestion, in the same session as its `/suggest` calls. */
export const searchBoxRetrieve = async (
  mapboxId: string,
  {
    sessionToken,
    signal,
    attributeSets = ["photos"],
  }: SessionOptions & { attributeSets?: ("photos" | "visit" | "venue")[] },
): Promise<Place | null> => {
  if (!mapboxId || !sessionToken) return null;
  try {
    const body = await mapboxGet<MapboxSearchResponse>(
      `/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}`,
      { session_token: sessionToken, attribute_sets: attributeSets.join(",") },
      signal,
    );
    const feature = body.features?.[0];
    return feature ? placeFromSearch(feature) : null;
  } catch {
    return null;
  }
};

/** `/forward` (text) or `/reverse` (coordinates). Empty on any failure. */
export const searchBoxPlaces = async (
  endpoint: "forward" | "reverse",
  params: Params,
  signal?: AbortSignal,
): Promise<Place[]> => {
  try {
    const body = await mapboxGet<MapboxSearchResponse>(
      `/search/searchbox/v1/${endpoint}`,
      params,
      signal,
    );
    return (body.features ?? []).flatMap(
      (feature) => placeFromSearch(feature) ?? [],
    );
  } catch {
    return [];
  }
};
