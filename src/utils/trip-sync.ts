import type {
  CreateTripInput,
  TripDto,
  TripStopInput,
  UpdateTripInput,
} from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";

/** Explicit fields keep client IDs and temporary Mapbox details out of requests. */
export const tripSaveBody = (trip: TripDraft | TripDto) => ({
  name: trip.name.trim(),
  stops: trip.stops.map((stop) => ({
    publicId: stop.publicId,
    mapboxId: stop.mapboxId?.trim(),
    name: stop.name.trim(),
    streetAddress: stop.streetAddress.trim(),
    areaAddress: stop.areaAddress.trim(),
    category: stop.category.trim(),
    coordinates: stop.coordinates,
  })),
});

const sameStopInput = (left: TripStopInput, right: TripStopInput) =>
  left.publicId === right.publicId &&
  left.mapboxId === right.mapboxId &&
  left.name === right.name &&
  left.streetAddress === right.streetAddress &&
  left.areaAddress === right.areaAddress &&
  left.category === right.category &&
  left.coordinates.lat === right.coordinates.lat &&
  left.coordinates.lng === right.coordinates.lng;

export const tripChanges = (draft: TripDraft, saved?: TripDto) => {
  const cleanedDraft = tripSaveBody(draft);
  if (!saved || draft.publicId !== saved.publicId) return cleanedDraft;
  const serverVersion = tripSaveBody(saved);
  return {
    ...(cleanedDraft.name !== serverVersion.name ? { name: cleanedDraft.name } : {}),
    ...(cleanedDraft.stops.length !== serverVersion.stops.length ||
    cleanedDraft.stops.some(
      (stop, index) => !sameStopInput(stop, serverVersion.stops[index]),
    )
      ? { stops: cleanedDraft.stops }
      : {}),
  };
};

export const requestTripSave = async (
  draft: TripDraft,
  saved?: TripDto,
): Promise<TripDto> => {
  let body: CreateTripInput | UpdateTripInput;
  if (draft.publicId) {
    if (!draft.version || !saved || draft.version !== saved.version) {
      throw new Error(
        "This draft is out of date. Reload and restore the latest saved trip before editing.",
      );
    }
    const changes = tripChanges(draft, saved);
    if (changes.name === undefined && changes.stops === undefined) return saved;
    body = { ...changes, version: draft.version } satisfies UpdateTripInput;
  } else {
    body = tripSaveBody(draft);
  }

  const response = await fetch(
    draft.publicId ? `/api/trips/${draft.publicId}` : "/api/trips",
    {
      method: draft.publicId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error ?? `Unable to save trip (${response.status})`,
    );
  }
  if (
    typeof payload?.publicId !== "string" ||
    !Number.isInteger(payload.version) ||
    typeof payload.name !== "string" ||
    !Array.isArray(payload.stops)
  ) {
    throw new Error("Invalid trip save response");
  }
  return payload as TripDto;
};

export const sameTrip = (left?: TripDraft, right?: TripDraft) =>
  !!left &&
  !!right &&
  (left.clientId === right.clientId ||
    (!!left.publicId && left.publicId === right.publicId));

/** Loaded trips use their public IDs as stable local keys. */
export const toTripDraft = (trip: TripDto, previous?: TripDraft): TripDraft => {
  const previousStops = new Map(
    previous?.stops.map((stop) => [stop.publicId, stop]),
  );
  return {
    ...trip,
    clientId: previous?.clientId ?? trip.publicId,
    stops: trip.stops.map((stop) => {
      const original = previousStops.get(stop.publicId);
      return {
        ...original,
        ...stop,
        clientId: original?.clientId ?? stop.publicId,
      };
    }),
  };
};

/** Match the submitted snapshot, even if the user reordered or removed stops while saving. */
export const reconcileSavedTrip = (
  draft: TripDraft,
  submitted: TripDraft,
  saved: TripDto,
): TripDraft => {
  const persistedByClientId = new Map(
    submitted.stops.map((stop, index) => [
      stop.clientId,
      { submitted: stop, saved: saved.stops[index] },
    ]),
  );
  return {
    ...draft,
    publicId: saved.publicId,
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
    version: saved.version,
    name: draft.name === submitted.name ? saved.name : draft.name,
    stops: draft.stops.map((stop, position) => {
      const match = persistedByClientId.get(stop.clientId);
      if (!match?.saved) return { ...stop, position };
      const persisted = match.saved;
      // Accept server normalization only for fields the user has not edited again.
      const fields = [
        "name",
        "mapboxId",
        "streetAddress",
        "areaAddress",
        "category",
      ] as const;
      const normalized = Object.fromEntries(
        fields
          .filter((field) => stop[field] === match.submitted[field])
          .map((field) => [field, persisted[field]]),
      );
      return {
        ...stop,
        ...normalized,
        publicId: persisted.publicId,
        createdAt: persisted.createdAt,
        updatedAt: persisted.updatedAt,
        visited: persisted.visited,
        visitedAt: persisted.visitedAt,
        position,
      };
    }),
  };
};