import { useShallow } from "zustand/react/shallow";
import type { PlaceDetailsInput, StopDetails } from "@/types/trip-api";
import type { TripStopDraft } from "@/types/trip-draft";
import { useTripStore } from "@/providers/trip-store-provider";
import { useStopDetailsStore } from "@/providers/stop-details-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { serverTrip } from "@/utils/trip-sync";
import { placeKey } from "@/utils/trip-stop";
import { uniqueBy } from "@/utils/unique-by";
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
  /** Stops in the trip at this place. */
  count: number;
};

/** Place details for the stops page: one row per place, saved apart from the trip draft. */
export const useStopDetails = () => {
  const user = useUserStore((state) => state.userInfo);
  const { trip, saved, isSaving, saveDetails } = useTripStore(
    useShallow((state) => ({
      trip: state.currentTrip,
      saved: serverTrip(state.trips, state.currentTrip),
      isSaving: state.save.status === "saving",
      saveDetails: state.saveDetails,
    })),
  );
  const tripId = saved?.publicId;
  const { draft, editDetails, clearTrip } = useStopDetailsStore(
    useShallow((state) => ({
      draft: tripId ? state.drafts[tripId] : undefined,
      editDetails: state.editDetails,
      clearTrip: state.clearTrip,
    })),
  );
  const places = new Map(saved?.places.map((place) => [place.key, place]));

  const rows = uniqueBy(trip.stops, placeKey).map((stop): StopDetailsRow => {
    const key = placeKey(stop);
    const place = places.get(key);
    return {
      key,
      place: place ?? stop,
      details:
        draft?.[key] ?? (place ? stopDetailsFrom(place) : emptyStopDetails),
      editable: !!place,
      count: trip.stops.filter((item) => placeKey(item) === key).length,
    };
  });

  const changes = Object.entries(draft ?? {}).flatMap(
    ([key, details]): PlaceDetailsInput[] => {
      const place = places.get(key);
      return place && !sameDetails(details, stopDetailsFrom(place))
        ? [{ ...details, publicId: place.publicId }]
        : [];
    },
  );

  const edit = (row: StopDetailsRow, patch: Partial<StopDetails>) => {
    if (tripId) editDetails(tripId, row.key, { ...row.details, ...patch });
  };
  const save = async () => {
    if (tripId && (await saveDetails(changes))) clearTrip(tripId);
  };
  const reset = () => {
    if (tripId) clearTrip(tripId);
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
