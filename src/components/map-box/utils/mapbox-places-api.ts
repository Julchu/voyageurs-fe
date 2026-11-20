import type { Place } from "@/utils/interfaces";
import type { MapboxPlaceRecord } from "@/types/mapbox";
import { mapboxGet } from "./mapbox-api";
import { isPoiId, placeFromRecord } from "./mapbox-place-parsing";

/** The endpoint takes the base64 form of the POI urn, without "=" padding. */
const base64PoiId = (mapboxId: string) =>
  mapboxId.startsWith("urn:") ? btoa(mapboxId).replaceAll("=", "") : mapboxId;

/** The full POI record. Undefined for other ids or on any failure (preview access, quota, network). */
export const fetchPlaceDetails = async (
  mapboxId: string,
  signal?: AbortSignal,
): Promise<Place | undefined> => {
  if (!isPoiId(mapboxId) || signal?.aborted) return;
  const id = base64PoiId(mapboxId);
  try {
    const record = await mapboxGet<MapboxPlaceRecord>(
      `/places/v1/details/retrieve/${encodeURIComponent(id)}`,
      {},
      signal,
    );
    return signal?.aborted ? undefined : placeFromRecord(record, id);
  } catch {
    return;
  }
};
