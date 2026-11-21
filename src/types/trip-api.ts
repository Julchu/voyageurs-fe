export type AvailabilityWindow = {
  day: number;
  startMinute: number;
  endMinute: number;
};

export type StopDetails = {
  category: string;
  type: string;
  details: string;
  notes: string;
  url: string;
  reservations: "booked" | "needs_reservation" | null;
  price: number | null;
};

/** One time slot per stop, within a single day. */
export type TimeSlot = {
  locked: boolean;
  id: string;
  stopId: string;
  date: string;
  startMinute: number;
  endMinute: number;
};

export type CalendarInput = {
  order?: string[];
  startDate: string | null;
  endDate: string | null;
  timeSlots: TimeSlot[];
  availability: { publicId: string; availability: AvailabilityWindow[] }[];
};

export type TripStopInput = {
  clientId?: string;
  publicId?: string;
  mapboxId?: string;
  name: string;
  streetAddress?: string;
  areaAddress?: string;
  category?: string;
  coordinates: { lat: number; lng: number };
};

export type CreateTripInput = {
  name?: string;
  stops?: TripStopInput[];
};

/** The backend saves one part per request: stop list, place details, or calendar. */
export type TripPatch =
  | CreateTripInput
  | { placeDetails: (StopDetails & { publicId: string })[] }
  | { calendar: CalendarInput };

type PlaceFields = {
  mapboxId?: string;
  name: string;
  streetAddress: string;
  areaAddress: string;
  category: string;
  coordinates: { lat: number; lng: number };
  availability: AvailabilityWindow[];
};

/** One per place in a trip; `key` matches placeKey. */
export type TripPlaceDto = StopDetails &
  PlaceFields & {
    publicId: string;
    key: string;
    createdAt: string | null;
    updatedAt: string | null;
  };

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
  stopIdMap?: Record<string, string>;
  publicId: string;
  createdAt: string | null;
  updatedAt: string | null;
  version: number;
  name: string;
  places: TripPlaceDto[];
  stops: TripStopDto[];
  startDate: string | null;
  endDate: string | null;
  timeSlots: TimeSlot[];
};
