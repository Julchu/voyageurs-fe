import type { TripDto, TripPatch } from "@/types/trip-api";
import { ApiError, apiJson } from "./client";

export const listTrips = async () => {
  const trips = await apiJson<TripDto[]>("/api/trips");
  if (!Array.isArray(trips)) throw new Error("Invalid trip response");
  return trips;
};

/** POST a new trip, or PATCH one part of a saved trip at its current version. */
export const sendTrip = async (
  saved: Pick<TripDto, "publicId" | "version"> | undefined,
  patch: TripPatch,
) => {
  const trip = await apiJson<TripDto>(
    saved ? `/api/trips/${saved.publicId}` : "/api/trips",
    {
      method: saved ? "PATCH" : "POST",
      body: JSON.stringify(
        saved ? { version: saved.version, ...patch } : patch,
      ),
    },
  );
  if (
    typeof trip?.publicId !== "string" ||
    !Number.isInteger(trip.version) ||
    !Array.isArray(trip.stops)
  )
    throw new Error("Invalid trip save response");
  return trip;
};

/** Deletes a saved trip. One that is already gone counts as deleted. */
export const deleteTrip = async (publicId: string) => {
  await apiJson(`/api/trips/${publicId}`, { method: "DELETE" }).catch(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 404) return;
      throw error;
    },
  );
};
