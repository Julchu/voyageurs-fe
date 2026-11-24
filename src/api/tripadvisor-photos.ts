import type { Place, PlacePhoto } from "@/types/place";

type TripadvisorPhotosResponse = {
  photos?: Omit<PlacePhoto, "provider">[];
  tripadvisorUrl?: string;
};

/**
 * Tripadvisor photos for a POI via the backend (signed-in only, billed per lookup).
 * Display only: `placeRecord()` whitelists fields, so these are never persisted.
 */
export const fetchTripadvisorPhotos = async (
  place: Pick<Place, "name" | "coordinates" | "mapboxId">,
  signal?: AbortSignal,
): Promise<Pick<Place, "photos" | "tripadvisorUrl"> | undefined> => {
  const params = new URLSearchParams({
    name: place.name,
    lat: String(place.coordinates.lat),
    lng: String(place.coordinates.lng),
  });
  if (place.mapboxId) params.set("mapboxId", place.mapboxId);

  try {
    const response = await fetch(`/api/tripadvisor/photos?${params}`, {
      signal,
    });
    if (!response.ok) return;
    const { photos = [], tripadvisorUrl } =
      (await response.json()) as TripadvisorPhotosResponse;
    // A Tripadvisor photo may only be shown with its link-back.
    if (!photos.length || !tripadvisorUrl) return;
    return {
      photos: photos.map((photo) => ({ ...photo, provider: "tripadvisor" })),
      tripadvisorUrl,
    };
  } catch {
    return;
  }
};
