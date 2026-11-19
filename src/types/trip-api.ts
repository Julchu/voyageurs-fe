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

export type TripStopDto = StopDetails & {
  publicId: string;
  createdAt: string | null;
  updatedAt: string | null;
  mapboxId?: string;
  name: string;
  streetAddress: string;
  areaAddress: string;
  coordinates: Coordinates;
  position: number;
  visited: boolean;
  visitedAt: string | null;
  availability: AvailabilityWindow[];
};

export type TripDto = {
  publicId: string;
  createdAt: string | null;
  updatedAt: string | null;
  version: number;
  name: string;
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

/** The backend saves exactly one scope per request: drawer, stop details or calendar. */
export type TripPatch =
  | Partial<CreateTripInput>
  | { stopDetails: (StopDetails & { publicId: string })[] }
  | { calendar: CalendarInput };

export type UpdateTripInput = TripPatch & { version: number };
