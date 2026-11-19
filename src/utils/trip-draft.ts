import type { TripDto, TripStopDto } from "@/types/trip-api";
import type { TripDraft, TripStopDraft } from "@/types/trip-draft";
import type { Place } from "@/utils/interfaces";

/** The ID the server knows, or the local one for anything unsaved. */
export const draftId = ({
  publicId,
  clientId,
}: {
  publicId?: string;
  clientId: string;
}) => publicId ?? clientId;

/** Stops at the same place share details and open hours. Must match the backend's placeKey. */
export const placeKey = ({
  mapboxId,
  coordinates,
}: Pick<TripStopDraft, "mapboxId" | "coordinates">) =>
  mapboxId?.trim() || `${coordinates.lat},${coordinates.lng}`;

export const sameTrip = (left: TripDraft, right: TripDraft) =>
  left.clientId === right.clientId ||
  (!!left.publicId && left.publicId === right.publicId);

export const newTrip = (
  name = "New Trip",
  clientId = crypto.randomUUID(),
): TripDraft => ({ clientId, name, stops: [] });

export const newStop = ({
  id,
  mapboxId,
  name,
  category,
  streetAddress,
  areaAddress,
  coordinates,
}: Place): TripStopDraft => ({
  clientId: crypto.randomUUID(),
  id,
  mapboxId,
  name,
  category,
  streetAddress,
  areaAddress,
  coordinates,
  visited: false,
});

const stopDraft = ({
  publicId,
  mapboxId,
  name,
  category,
  streetAddress,
  areaAddress,
  coordinates,
  visited,
}: TripStopDto) => ({
  publicId,
  mapboxId,
  name,
  category,
  streetAddress,
  areaAddress,
  coordinates,
  visited,
});

/** Drawer draft for a saved trip. Keeps existing client IDs so list items don't remount. */
export const toTripDraft = (trip: TripDto, previous?: TripDraft): TripDraft => {
  const previousStops = new Map(
    previous?.stops.map((stop) => [
      stop.publicId ?? trip.stopIdMap?.[stop.clientId],
      stop,
    ]),
  );

  return {
    clientId: previous?.clientId ?? trip.publicId,
    publicId: trip.publicId,
    version: trip.version,
    name: trip.name,
    stops: trip.stops.map((stop) => {
      const local = previousStops.get(stop.publicId);
      return {
        ...local,
        ...stopDraft(stop),
        clientId: local?.clientId ?? stop.publicId,
      };
    }),
  };
};
