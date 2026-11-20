import type { Place, PlaceDetails, PlacePhoto } from "@/utils/interfaces";
import type {
  MapboxMetadata,
  MapboxPlaceRecord,
  MapboxSearchFeature,
  MapboxSuggestion,
} from "@/types/mapbox";
import type { SearchSuggestion } from "./mapbox-search-box";

/** Places API POI ids: "urn:mbxpoi:…", or that urn in base64 ("dXJuOm1ieHBvaTo…"). */
export const isPoiId = (id?: string): id is string =>
  !!id && (id.startsWith("urn:mbxpoi:") || id.startsWith("dXJuOm1ieHBvaTo"));

const isWebUrl = (url: string) => {
  const lower = url.toLowerCase();
  return lower.startsWith("https://") || lower.startsWith("http://");
};

const isCoordinate = (value?: number): value is number =>
  Number.isFinite(value);

/** Web photos from Mapbox metadata, primary first, without repeats. */
const photosFrom = (metadata?: MapboxMetadata): PlacePhoto[] => {
  if (!metadata) return [];
  const primary = metadata.primary_photo ?? [];
  const candidates = [
    ...(Array.isArray(primary) ? primary : [primary]),
    ...(metadata.photos ?? []),
  ];

  const seen = new Set<string>();
  return candidates.flatMap((candidate) => {
    const photo =
      typeof candidate === "string" ? { url: candidate } : candidate;
    if (!photo.url || !isWebUrl(photo.url) || seen.has(photo.url)) return [];
    seen.add(photo.url);
    return [{ url: photo.url, width: photo.width, height: photo.height }];
  });
};

const detailsFrom = (metadata?: MapboxMetadata): PlaceDetails | undefined => {
  const { website, phone, opening_hours } = metadata ?? {};
  const openingHours =
    typeof opening_hours === "string" ? opening_hours : undefined;
  if (!website && !phone && openingHours === undefined) return;
  return { website, phone, openingHours, photos: [] };
};

/** Joins non-empty parts, skipping repeats that differ only by case. */
const joinAddress = (parts: (string | undefined)[], separator = ", ") => {
  const unique = new Map<string, string>();
  for (const part of parts) {
    const value = part?.trim();
    if (value) unique.set(value.toLowerCase(), value);
  }
  return [...unique.values()].join(separator);
};

export const suggestionFrom = (
  item: MapboxSuggestion,
): SearchSuggestion | null => {
  if (!item.mapbox_id || !item.name) return null;
  return {
    mapboxId: item.mapbox_id,
    name: item.name_preferred ?? item.name,
    featureType: item.feature_type ?? "",
    streetAddress: item.address ?? "",
    areaAddress: item.place_formatted ?? "",
    category: item.poi_category_ids?.[0] ?? item.poi_category?.[0] ?? "",
  };
};

/** A place from a Search Box `/retrieve`, `/forward` or `/reverse` feature. */
export const placeFromSearch = (feature: MapboxSearchFeature): Place | null => {
  const props = feature.properties;
  const lng =
    props?.coordinates?.longitude ?? feature.geometry?.coordinates?.[0];
  const lat =
    props?.coordinates?.latitude ?? feature.geometry?.coordinates?.[1];
  const name = props?.name_preferred ?? props?.name;
  if (!name || typeof lng !== "number" || typeof lat !== "number") return null;

  const placeDetails = detailsFrom(props?.metadata);
  return {
    mapboxId: props?.mapbox_id,
    name,
    category:
      props?.poi_category_ids?.[0] ??
      props?.poi_category?.[0] ??
      props?.feature_type ??
      "",
    streetAddress:
      props?.address ??
      props?.context?.address?.name ??
      props?.context?.street?.name ??
      "",
    areaAddress: props?.place_formatted ?? "",
    coordinates: { lat, lng },
    photos: photosFrom(props?.metadata),
    // POIs still need Places API photos and details when opened.
    placeInfoLoaded: !isPoiId(props?.mapbox_id),
    ...(placeDetails && { placeDetails }),
  };
};

/** A place from a Places API record. */
export const placeFromRecord = (
  record: MapboxPlaceRecord,
  id: string,
): Place | undefined => {
  const lat = record.coordinates?.latitude;
  const lng = record.coordinates?.longitude;
  if (!record.name || !isCoordinate(lat) || !isCoordinate(lng)) return;

  const { address } = record;
  const photos = photosFrom({ photos: record.photos });
  return {
    mapboxId: record.mapbox_id ?? id,
    name: record.name,
    coordinates: { lat, lng },
    streetAddress:
      address?.address_line_1?.trim() ||
      joinAddress([address?.address_number, address?.street_name], " "),
    areaAddress: joinAddress([
      address?.locality,
      address?.city,
      address?.postcode,
    ]),
    category: record.primary_category || record.categories?.[0] || "",
    photos,
    placeInfoLoaded: true,
    placeDetails: {
      ...(record.website && { website: record.website }),
      ...(record.phone && { phone: record.phone }),
      ...(record.opening_hours && { openingHours: record.opening_hours }),
      permanentlyClosed: record.permanently_closed ?? null,
      popularity: record.score?.popularity ?? null,
      photos,
    },
  };
};
