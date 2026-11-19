import type {
  CreateTripInput,
  TripDto,
  TripStopInput,
  UpdateTripInput,
} from "@/types/trip-api";
import type { TripDraft, TripStopDraft } from "@/types/trip-draft";
import { isEqual } from "@/utils/data";
import { toTripDraft } from "@/utils/trip-draft";

const stopInput = (stop: TripStopDraft): TripStopInput => ({
  ...(stop.publicId
    ? { publicId: stop.publicId }
    : { clientId: stop.clientId }),
  mapboxId: stop.mapboxId?.trim(),
  name: stop.name.trim(),
  streetAddress: stop.streetAddress.trim(),
  areaAddress: stop.areaAddress.trim(),
  category: stop.category.trim(),
  coordinates: stop.coordinates,
});

/** Explicit fields keep client-only data (photos, details) out of requests. */
export const tripSaveBody = (trip: TripDraft): CreateTripInput => ({
  name: trip.name.trim(),
  stops: trip.stops.map(stopInput),
});

/** Drawer fields that differ from the saved trip. A new trip sends everything. */
export const tripChanges = (
  draft: TripDraft,
  saved?: TripDto,
): Partial<CreateTripInput> => {
  const body = tripSaveBody(draft);
  if (!saved) return body;

  const base = tripSaveBody(toTripDraft(saved));
  return {
    ...(body.name !== base.name && { name: body.name }),
    ...(!isEqual(body.stops, base.stops) && { stops: body.stops }),
  };
};

export const isTripDirty = (draft: TripDraft, saved?: TripDto) =>
  Object.keys(tripChanges(draft, saved)).length > 0;

const isTripDto = (value: unknown): value is TripDto => {
  const trip = value as Partial<TripDto> | null;
  return (
    typeof trip?.publicId === "string" &&
    Number.isInteger(trip.version) &&
    typeof trip.name === "string" &&
    Array.isArray(trip.places) &&
    Array.isArray(trip.stops)
  );
};

/** POST creates a trip; PATCH saves one scope of an existing trip. */
export const sendTrip = async (
  publicId: string | undefined,
  body: CreateTripInput | UpdateTripInput,
): Promise<TripDto> => {
  const response = await fetch(
    publicId ? `/api/trips/${publicId}` : "/api/trips",
    {
      method: publicId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok)
    throw new Error(
      payload?.error ?? `Unable to save trip (${response.status})`,
    );
  if (!isTripDto(payload)) throw new Error("Invalid trip save response");
  return payload;
};
