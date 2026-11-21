import type { StopDetails } from "@/types/trip-api";

export const emptyStopDetails: StopDetails = {
  category: "",
  type: "",
  details: "",
  notes: "",
  url: "",
  reservations: null,
  price: null,
};

/** Only the editable detail fields of a place. */
export const stopDetailsFrom = (place: StopDetails): StopDetails => ({
  category: place.category ?? "",
  type: place.type ?? "",
  details: place.details ?? "",
  notes: place.notes ?? "",
  url: place.url ?? "",
  reservations: place.reservations ?? null,
  price: place.price ?? null,
});

export const sameDetails = (left: StopDetails, right: StopDetails) =>
  (Object.keys(emptyStopDetails) as (keyof StopDetails)[]).every(
    (field) => left[field] === right[field],
  );
