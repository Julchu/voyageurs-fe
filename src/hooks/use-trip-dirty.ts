import { useMemo } from "react";
import type { Trip } from "@/utils/interfaces";
import { sameTrip, tripSaveBody } from "@/utils/trip-sync";

export const useTripDirty = (
  currentTrip?: Trip,
  serverTrip?: Trip,
): boolean => {
  return useMemo(
    () => isTripDirty(currentTrip, serverTrip),
    [currentTrip, serverTrip],
  );
};

const isTripDirty = (currentTrip?: Trip, serverTrip?: Trip) => {
  if (!currentTrip) return false;
  if (!serverTrip || !sameTrip(currentTrip, serverTrip)) return true;

  // Match the save payload so temporary place details don't mark a trip dirty.
  const draft = tripSaveBody(currentTrip);
  const saved = tripSaveBody(serverTrip);

  return (
    draft.name !== saved.name ||
    draft.stops.length !== saved.stops.length ||
    draft.stops.some((stop, index) => {
      const savedStop = saved.stops[index];

      return (
        stop.publicId !== savedStop.publicId ||
        stop.mapboxId !== savedStop.mapboxId ||
        stop.name !== savedStop.name ||
        stop.streetAddress !== savedStop.streetAddress ||
        stop.areaAddress !== savedStop.areaAddress ||
        stop.category !== savedStop.category ||
        stop.coordinates.lat !== savedStop.coordinates.lat ||
        stop.coordinates.lng !== savedStop.coordinates.lng
      );
    })
  );
};
