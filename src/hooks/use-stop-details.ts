"use client";

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { StopDetails } from "@/types/trip-api";
import type { TripStopDraft } from "@/types/trip-draft";
import { useTripStore } from "@/providers/trip-store-provider";
import { useStopDetailsStore } from "@/providers/stop-details-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { serverTrip } from "@/utils/trip-sync";
import { placeKey } from "@/utils/trip-stop";
import {
  emptyStopDetails,
  sameDetails,
  stopDetailsFrom,
} from "@/utils/stop-details";

export type StopDetailsRow = {
  key: string;
  place: Pick<
    TripStopDraft,
    "name" | "streetAddress" | "areaAddress" | "coordinates"
  >;
  details: StopDetails;
  /** Places get details once the trip has saved them. */
  editable: boolean;
};

/** Place details for the stops page: one row per place, saved apart from the trip draft. */
export const useStopDetails = () => {
  const user = useUserStore((state) => state.userInfo);
  const { trip, saved, isSaving, saveDetails } = useTripStore(
    useShallow((state) => ({
      trip: state.currentTrip,
      saved: serverTrip(state.trips, state.currentTrip),
      isSaving: state.tripSaveStatus === "saving",
      saveDetails: state.saveDetails,
    })),
  );
  const tripId = saved?.publicId;
  const { draft, editDetails, clearDetails } = useStopDetailsStore(
    useShallow((state) => ({
      draft: tripId ? state.drafts[tripId] : undefined,
      editDetails: state.editDetails,
      clearDetails: state.clearDetails,
    })),
  );
  const places = useMemo(
    () => new Map(saved?.places.map((place) => [place.key, place])),
    [saved],
  );

  const rows = useMemo(() => {
    const rows = new Map<string, StopDetailsRow>();
    for (const stop of trip?.stops ?? []) {
      const key = placeKey(stop);
      if (rows.has(key)) continue;
      const place = places.get(key);
      rows.set(key, {
        key,
        place: place ?? stop,
        details:
          draft?.[key] ?? (place ? stopDetailsFrom(place) : emptyStopDetails),
        editable: !!place,
      });
    }
    return [...rows.values()];
  }, [trip?.stops, places, draft]);

  const changes = useMemo(
    () =>
      Object.entries(draft ?? {}).flatMap(([key, details]) => {
        const place = places.get(key);
        return place && !sameDetails(details, stopDetailsFrom(place))
          ? [{ ...details, publicId: place.publicId }]
          : [];
      }),
    [draft, places],
  );

  const edit = useCallback(
    (row: StopDetailsRow, patch: Partial<StopDetails>) => {
      if (tripId) editDetails(tripId, row.key, { ...row.details, ...patch });
    },
    [tripId, editDetails],
  );
  const save = async () => {
    if (tripId && (await saveDetails(changes))) clearDetails(tripId);
  };
  const reset = () => {
    if (tripId) clearDetails(tripId);
  };

  return {
    trip,
    rows,
    edit,
    isDirty: changes.length > 0,
    isSaving,
    canSave: !!user,
    save,
    reset,
  };
};
