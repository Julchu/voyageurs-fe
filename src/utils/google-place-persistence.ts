import type { Place, Trip } from "@/utils/interfaces";

/** Retain Google place IDs; fetch provider content for the current display. */
export const googlePersistablePlace = <T extends Place>(place: T): T => {
  if (!place.mapboxId?.startsWith("google:")) return place;
  return {
    ...place,
    name: "Saved place",
    streetAddress: "",
    areaAddress: "",
    category: "",
    // Placeholder required by the existing schema; never rendered as a location.
    coordinates: { lat: 0, lng: 0 },
    id: undefined,
    photos: undefined,
    details: undefined,
    placeInfoLoaded: undefined,
    placeInfoProvider: undefined,
    googleAttributions: undefined,
  };
};

export const googlePersistableTrip = <T extends Pick<Trip, "stops">>(
  trip: T,
): T => ({
  ...trip,
  stops: trip.stops.map(googlePersistablePlace),
});
