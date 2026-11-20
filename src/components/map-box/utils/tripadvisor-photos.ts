import type { Place, PlacePhoto } from "@/utils/interfaces";

type TripadvisorPhotosResponse = {
  photos?: {
    url: string;
    width: number | null;
    height: number | null;
    author?: string;
  }[];
  tripadvisorUrl?: string;
};

/**
 * Tripadvisor photos for a POI via `/api/tripadvisor/photos` (the API key stays
 * on the server). Display only: these fields must never be persisted, which
 * `placeRecord()` already guarantees by whitelisting fields.
 */
export const fetchTripadvisorPhotos = async (
  place: Pick<Place, "name" | "coordinates" | "mapboxId">,
  signal?: AbortSignal,
): Promise<Pick<Place, "photos" | "tripadvisorUrl"> | undefined> => {
  const params = new URLSearchParams({
    name: place.name,
    lat: String(place.coordinates.lat),
    lon: String(place.coordinates.lng),
  });
  if (place.mapboxId) params.set("mapboxId", place.mapboxId);

  try {
    const response = await fetch(`/api/tripadvisor/photos?${params}`, {
      signal,
    });
    if (!response.ok) return;
    const body = (await response.json()) as TripadvisorPhotosResponse;
    const photos: PlacePhoto[] = (body.photos ?? []).map((photo) => ({
      ...photo,
      provider: "tripadvisor",
    }));
    // A Tripadvisor photo may only be shown with its link-back.
    if (!photos.length || !body.tripadvisorUrl) return;
    return { photos, tripadvisorUrl: body.tripadvisorUrl };
  } catch {
    return;
  }
};
