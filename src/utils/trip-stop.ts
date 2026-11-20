import type { TripStopDraft } from "@/types/trip-draft";

/** Saved stops use their public ID; new stops use their client ID until saved. */
export const stopId = (stop: Pick<TripStopDraft, "publicId" | "clientId">) =>
  stop.publicId ?? stop.clientId;

/** Stops at the same place share details and open hours. Matches the backend's place key. */
export const placeKey = (
  stop: Pick<TripStopDraft, "mapboxId" | "coordinates">,
) => stop.mapboxId?.trim() || `${stop.coordinates.lat},${stop.coordinates.lng}`;
