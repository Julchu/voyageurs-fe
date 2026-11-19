import type { Coordinates } from "@/utils/interfaces";

// Mirrors the backend trip contract (voyageurs-be/src/modules/trip).

export type StopDetails = {
  category: string;
  type: string;
  details: string;
  notes: string;
  url: string;
  reservations: "booked" | "needs_reservation" | null;
  price: number | null;
};

/** Weekly open hours in trip-local minutes. An empty list means open anytime. */
export type AvailabilityWindow = {
  day: number;
  startMinute: number;
  endMinute: number;
};

/** One visit per stop, within a single day. `locked` is shown as "Reserved". */
export type ScheduledVisit = {
  id: string;
  stopId: string;
  date: string;
  startMinute: number;
  endMinute: number;
  locked: boolean;
};

type PlaceFields = {
  mapboxId?: string;
  name: string;
  streetAddress: string;
  areaAddress: string;
  category: string;
  coordinates: Coordinates;
  availability: AvailabilityWindow[];
};

/** One per place in a trip; its stops share these details. `key` matches placeKey. */
export type TripPlaceDto = StopDetails &
  PlaceFields & {
    publicId: string;
    key: string;
    createdAt: string | null;
    updatedAt: string | null;
  };

/** Place fields are copied in from the stop's place. */
export type TripStopDto = PlaceFields & {
  publicId: string;
  placeId: string;
  createdAt: string | null;
  updatedAt: string | null;
  position: number;
  visited: boolean;
  visitedAt: string | null;
};

export type TripDto = {
  publicId: string;
  createdAt: string | null;
  updatedAt: string | null;
  version: number;
  name: string;
  places: TripPlaceDto[];
  stops: TripStopDto[];
  startDate: string | null;
  endDate: string | null;
  visits: ScheduledVisit[];
  /** Temporary client IDs mapped to the public IDs a save just created. */
  stopIdMap?: Record<string, string>;
};

export type TripStopInput = Pick<
  TripStopDto,
  "name" | "streetAddress" | "areaAddress" | "category" | "coordinates"
> & { publicId?: string; clientId?: string; mapboxId?: string };

export type CreateTripInput = { name: string; stops: TripStopInput[] };

/** A calendar copy of an existing stop, created on save. */
export type StopCopy = { clientId: string; sourceStopId: string };

export type CalendarInput = Pick<
  TripDto,
  "startDate" | "endDate" | "visits"
> & {
  order: string[];
  newStops: StopCopy[];
  availability: { publicId: string; availability: AvailabilityWindow[] }[];
};

/** The backend saves exactly one scope per request: drawer, place details or calendar. */
export type TripPatch =
  | Partial<CreateTripInput>
  | { placeDetails: (StopDetails & { publicId: string })[] }
  | { calendar: CalendarInput };

export type UpdateTripInput = TripPatch & { version: number };
