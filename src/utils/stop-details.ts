import type { StopDetails } from "@/types/trip-api";

const DETAIL_FIELDS = [
  "category",
  "type",
  "details",
  "notes",
  "url",
  "reservations",
  "price",
] as const satisfies readonly (keyof StopDetails)[];

export const emptyStopDetails: StopDetails = {
  category: "",
  type: "",
  details: "",
  notes: "",
  url: "",
  reservations: null,
  price: null,
};

type DetailFields = Pick<StopDetails, (typeof DETAIL_FIELDS)[number]>;

/** Only the editable detail fields of a place. Won't compile if DETAIL_FIELDS misses one. */
export const stopDetailsFrom = (place: StopDetails): StopDetails =>
  // Object.fromEntries drops key types; the cast names exactly the keys mapped.
  Object.fromEntries(
    DETAIL_FIELDS.map((field) => [field, place[field]]),
  ) as DetailFields;

export const sameDetails = (left: StopDetails, right: StopDetails) =>
  DETAIL_FIELDS.every((field) => left[field] === right[field]);
