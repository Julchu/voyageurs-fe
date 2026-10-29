import type { Coordinates, Place, PlacePhoto } from "@/utils/interfaces";
import type {
  ForwardOptions,
  PlaceDetails,
  RetrieveOptions,
  SearchSuggestion,
  SuggestOptions,
} from "@/components/map-box/utils/place-geocoding";

/* Google Maps Platform adapter — a drop-in mirror of `place-geocoding.ts`.
 *
 * Same inputs/outputs as the Mapbox adapter (`Place`, `SearchSuggestion`,
 * `PlaceDetails`), so components can swap imports without other changes. The
 * Google `placeId` is carried as `google:<id>` in the existing `mapboxId` field.
 * Places calls go through `/api/google/*` so the server key and the
 * cost-controlling field masks stay server-side.
 *
 * Flows:
 * - Address bar type-ahead: Autocomplete (New) + Details (shared sessionToken)
 * - Native Google POI clicks: Details (New) by id; legacy stops: Text Search
 * - "See more details": Details (New) with the richer field-mask tier
 */

/** Billed Autocomplete session; reuse the same token on the matching retrieve. */
export const googleCreateSessionToken = (): string => crypto.randomUUID();

const googleIsAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

const googleCircleBias = (center: Coordinates, radius: number) => ({
  circle: {
    center: { latitude: center.lat, longitude: center.lng },
    radius,
  },
});

/** Photo SKU is billed per upstream fetch — never mint more URLs than the card shows. */
const GOOGLE_MAX_PHOTOS = 6;

/** Our photo proxy URL — pass it to `next/image` as `src`. */
const googlePhotoUrl = (name: string, width = 800): string =>
  `/api/google/photo?name=${encodeURIComponent(name)}&w=${width}`;

// --- Google response shapes (only the fields the field masks return) ---------

type GooglePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  googleMapsUri?: string;
  authorAttributions?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  }[];
};
type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};
type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  types?: string[];
  primaryTypeDisplayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  photos?: GooglePhoto[];
  attributions?: { provider?: string; providerUri?: string }[];
};

const googlePhotosFromApi = (photos?: GooglePhoto[]): PlacePhoto[] =>
  (photos ?? [])
    .flatMap((photo) =>
      photo.name
        ? [
            {
              url: googlePhotoUrl(photo.name),
              width: photo.widthPx,
              height: photo.heightPx,
              googleMapsUri: photo.googleMapsUri,
              googleAuthors: (photo.authorAttributions ?? []).map((author) => ({
                name: author.displayName ?? "Photo contributor",
                uri: author.uri,
                photoUri: author.photoUri,
              })),
            },
          ]
        : [],
    )
    .slice(0, GOOGLE_MAX_PHOTOS);

const googleAddressComponentText = (
  components: GoogleAddressComponent[] | undefined,
  type: string,
): string | undefined =>
  components?.find((component) => component.types?.includes(type))?.longText;

/**
 * Split a Google place into the app's street vs area address lines, mirroring
 * Mapbox's `address` / `place_formatted` split.
 */
const googleSplitAddress = (
  place: GooglePlace,
): { streetAddress: string; areaAddress: string } => {
  const components = place.addressComponents;
  const number = googleAddressComponentText(components, "street_number");
  const route = googleAddressComponentText(components, "route");
  const street = [number, route].filter(Boolean).join(" ");

  const area = [
    googleAddressComponentText(components, "locality") ??
      googleAddressComponentText(components, "postal_town") ??
      googleAddressComponentText(components, "administrative_area_level_2"),
    googleAddressComponentText(components, "administrative_area_level_1"),
    googleAddressComponentText(components, "country"),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    streetAddress:
      street || place.shortFormattedAddress || place.formattedAddress || "",
    areaAddress: area || "",
  };
};

const googlePlaceFromApi = (place: GooglePlace): Place | null => {
  const name = place.displayName?.text;
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!name || typeof lat !== "number" || typeof lng !== "number") return null;

  const { streetAddress, areaAddress } = googleSplitAddress(place);
  return {
    mapboxId: place.id ? `google:${place.id}` : undefined,
    name,
    category: place.primaryTypeDisplayName?.text ?? place.types?.[0] ?? "",
    streetAddress,
    areaAddress,
    coordinates: { lat, lng },
    photos: googlePhotosFromApi(place.photos),
    placeInfoLoaded: true,
    placeInfoProvider: "google",
    googleAttributions: place.attributions?.flatMap((item) =>
      item.provider ? [{ provider: item.provider, uri: item.providerUri }] : [],
    ),
  };
};

// --- Autocomplete (type-ahead) ----------------------------------------------

type GoogleAutocompleteResponse = {
  suggestions?: {
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      types?: string[];
    };
  }[];
};

/** Autocomplete dropdown: Places Autocomplete (New). */
export const googleSuggest = async (
  query: string,
  options: SuggestOptions,
): Promise<SearchSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 1 || !options.sessionToken) return [];

  const payload = {
    input: trimmed,
    sessionToken: options.sessionToken,
    ...(options.proximity
      ? { locationBias: googleCircleBias(options.proximity, 50000) }
      : {}),
  };

  try {
    const response = await fetch("/api/google/autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: options.signal,
    });
    if (!response.ok) throw new Error("Google autocomplete failed");
    const body = (await response.json()) as GoogleAutocompleteResponse;
    const limit = options.limit ?? 5;
    return (body.suggestions ?? [])
      .flatMap((item) => {
        const prediction = item.placePrediction;
        if (!prediction?.placeId) return [];
        const main = prediction.structuredFormat?.mainText?.text;
        const name = main ?? prediction.text?.text;
        if (!name) return [];
        return [
          {
            mapboxId: prediction.placeId,
            name,
            featureType: prediction.types?.[0] ?? "",
            streetAddress: "",
            areaAddress: prediction.structuredFormat?.secondaryText?.text ?? "",
            category: prediction.types?.[0] ?? "",
          } satisfies SearchSuggestion,
        ];
      })
      .slice(0, limit);
  } catch (error) {
    if (googleIsAbort(error)) return [];
    throw error;
  }
};

// --- Retrieve a suggestion / fetch a place by id ----------------------------

const googleFetchPlace = async (
  placeId: string,
  params: { tier?: "basic" | "full"; sessionToken?: string },
  signal?: AbortSignal,
): Promise<GooglePlace | null> => {
  const query = new URLSearchParams();
  if (params.tier) query.set("tier", params.tier);
  if (params.sessionToken) query.set("sessionToken", params.sessionToken);
  const suffix = query.toString() ? `?${query}` : "";

  const response = await fetch(
    `/api/google/details/${encodeURIComponent(placeId.replace(/^google:/, ""))}${suffix}`,
    { signal, cache: "no-store" },
  );
  if (!response.ok) return null;
  return (await response.json()) as GooglePlace;
};

/**
 * Resolve a `googleSuggest` hit to a full `Place`. Pass the same `sessionToken`
 * used for the autocomplete calls so Google bills it as one session.
 */
export const googleRetrieve = async (
  placeId: string,
  options: Partial<RetrieveOptions> = {},
): Promise<Place | null> => {
  if (!placeId) return null;
  try {
    const place = await googleFetchPlace(
      placeId,
      { tier: "basic", sessionToken: options.sessionToken },
      options.signal,
    );
    return place ? googlePlaceFromApi(place) : null;
  } catch (error) {
    if (googleIsAbort(error)) return null;
    return null;
  }
};

// --- Text search (address bar forward) --------------------------------------

type GoogleTextSearchResponse = { places?: GooglePlace[] };

/** Meters between two points; enough to rank nearby Text Search hits. */
const googleMetersBetween = (a: Coordinates, b: Coordinates) => {
  const googleToRadians = (deg: number) => (deg * Math.PI) / 180;
  const lat = googleToRadians(b.lat - a.lat);
  const lng =
    googleToRadians(b.lng - a.lng) *
    Math.cos(googleToRadians((a.lat + b.lat) / 2));
  return Math.hypot(lat, lng) * 6_371_000;
};

const googleTextSearch = async (
  textQuery: string,
  params: {
    proximity?: Coordinates;
    radius?: number;
    maxResultCount?: number;
    signal?: AbortSignal;
  },
): Promise<Place[]> => {
  const trimmed = textQuery.trim();
  if (trimmed.length < 1) return [];

  const payload = {
    textQuery: trimmed,
    maxResultCount: params.maxResultCount ?? 5,
    ...(params.proximity
      ? {
          locationBias: googleCircleBias(
            params.proximity,
            params.radius ?? 50000,
          ),
        }
      : {}),
  };

  try {
    const response = await fetch("/api/google/text-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: params.signal,
    });
    if (!response.ok) return [];
    const body = (await response.json()) as GoogleTextSearchResponse;
    return (body.places ?? []).flatMap((place) => {
      const mapped = googlePlaceFromApi(place);
      return mapped ? [mapped] : [];
    });
  } catch (error) {
    if (googleIsAbort(error)) return [];
    return [];
  }
};

/** Text search (address bar): Text Search (New). */
export const googleForward = async (
  query: string,
  options: ForwardOptions = {},
): Promise<Place[]> =>
  googleTextSearch(query, {
    proximity: options.proximity,
    maxResultCount: options.limit ?? 5,
    signal: options.signal,
  });

/**
 * Enrich a map POI/landmark click (name + coordinates from the Mapbox
 * featureset) with a Google place id, address, and photos.
 *
 * Text Search only allows a circle on `locationBias` (preference), not on
 * `locationRestriction` (hard box, rectangle only). Bias the name search, then
 * keep the closest hit within 500 metres of the legacy stop.
 */
export const googleEnrichPlace = async (
  place: Pick<Place, "name" | "coordinates">,
  signal?: AbortSignal,
): Promise<Partial<Place> | undefined> => {
  const matches = await googleTextSearch(place.name, {
    proximity: place.coordinates,
    radius: 500,
    maxResultCount: 5,
    signal,
  });
  const match = matches.reduce<Place | undefined>((closest, candidate) => {
    if (!closest) return candidate;
    return googleMetersBetween(place.coordinates, candidate.coordinates) <
      googleMetersBetween(place.coordinates, closest.coordinates)
      ? candidate
      : closest;
  }, undefined);
  if (!match || googleMetersBetween(place.coordinates, match.coordinates) > 500)
    return;
  return match;
};

const googleHasPlaceId = (place: Place) =>
  Boolean(
    place.mapboxId &&
      place.placeInfoProvider !== "mapbox" &&
      !/^(urn:|dXJuOm)/.test(place.mapboxId),
  );

/** Stored provider data must not be mistaken for a fresh Google lookup. */
export const googlePlacePreview = (place: Place): Place =>
  place.placeInfoProvider === "google"
    ? place
    : {
        ...place,
        photos: undefined,
        details: undefined,
        placeInfoLoaded: false,
        googleAttributions: undefined,
      };

export const googleNeedsPlaceLookup = (place: Place): boolean =>
  !googleHasPlaceId(place) ||
  place.placeInfoProvider !== "google" ||
  !place.placeInfoLoaded;

/** Resolve legacy Mapbox records by name; a Google id alone isn't cached data. */
export const googleResolvePlace = async (
  place: Place,
  signal?: AbortSignal,
): Promise<Place | undefined> => {
  const enriched = googleHasPlaceId(place)
    ? await googleRetrieve(place.mapboxId!, { signal })
    : await googleEnrichPlace(place, signal);
  if (!enriched?.mapboxId || signal?.aborted) return;
  return {
    ...place,
    mapboxId: enriched.mapboxId,
    name: enriched.name || place.name,
    coordinates: enriched.coordinates ?? place.coordinates,
    streetAddress: enriched.streetAddress || place.streetAddress,
    areaAddress: enriched.areaAddress || place.areaAddress,
    category: enriched.category || place.category,
    photos: enriched.photos ?? [],
    placeInfoLoaded: true,
    placeInfoProvider: "google",
    googleAttributions: enriched.googleAttributions,
  };
};

// --- Lazy "see more" details ------------------------------------------------

type GoogleDetailsResponse = GooglePlace & {
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  businessStatus?: string;
};

/**
 * Lazily fetch the richer Places Details record (contact, hours, status).
 * Called on demand (e.g. a "See more" action), not during search, so the
 * pricier field-mask tier isn't spent on every result.
 */
export const googleFetchPlaceDetails = async (
  placeId: string,
  signal?: AbortSignal,
): Promise<PlaceDetails | undefined> => {
  if (!placeId) return;
  try {
    const place = (await googleFetchPlace(
      placeId,
      { tier: "full" },
      signal,
    )) as GoogleDetailsResponse | null;
    if (!place) return;
    return {
      website: place.websiteUri,
      phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber,
      openingHours: place.regularOpeningHours?.weekdayDescriptions?.join("\n"),
      popularity: null,
      permanentlyClosed: place.businessStatus === "CLOSED_PERMANENTLY",
      photos: googlePhotosFromApi(place.photos),
    };
  } catch (error) {
    if (googleIsAbort(error)) return;
    return;
  }
};
