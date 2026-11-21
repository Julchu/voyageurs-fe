import type { TimeSlot } from "@/types/trip-api";
import type { TripStopDraft } from "@/types/trip-draft";
import type { TripActionCreator } from "./trip-store";
import { draftEditor } from "./trip-draft-actions";
import { placeKey, stopId } from "@/utils/trip-stop";
import { compareSlots } from "@/utils/trip-time";

/** Scheduled stops follow their time slots; unscheduled stops keep their place. */
const orderBySchedule = (
  stops: TripStopDraft[],
  slots: TimeSlot[],
): TripStopDraft[] => {
  const byStop = new Map(slots.map((slot) => [slot.stopId, slot]));
  const scheduled = stops
    .filter((stop) => byStop.has(stopId(stop)))
    .sort((a, b) =>
      compareSlots(byStop.get(stopId(a))!, byStop.get(stopId(b))!),
    );
  let index = 0;
  return stops.map((stop) =>
    byStop.has(stopId(stop)) ? scheduled[index++] : stop,
  );
};

export const createTripCalendarActions: TripActionCreator<
  | "setTripDates"
  | "setTimeSlot"
  | "removeTimeSlot"
  | "toggleReserved"
  | "setOpenHours"
> = (set, get) => {
  const edit = draftEditor(set, get);

  return {
    setTripDates: (startDate, endDate) =>
      edit((trip) => ({ ...trip, startDate, endDate })),
    setTimeSlot: (slot) =>
      edit((trip) => {
        const slots = [
          ...trip.timeSlots.filter((item) => item.stopId !== slot.stopId),
          slot,
        ].sort(compareSlots);
        // The backend needs scheduled stops in time order.
        return {
          ...trip,
          timeSlots: slots,
          stops: orderBySchedule(trip.stops, slots),
        };
      }),
    removeTimeSlot: (slotId) =>
      edit((trip) => ({
        ...trip,
        timeSlots: trip.timeSlots.filter((slot) => slot.id !== slotId),
      })),
    toggleReserved: (slotId) =>
      edit((trip) => ({
        ...trip,
        timeSlots: trip.timeSlots.map((slot) =>
          slot.id === slotId ? { ...slot, locked: !slot.locked } : slot,
        ),
      })),
    // Open hours belong to the place, so every stop there gets the same hours.
    setOpenHours: (id, availability) =>
      edit((trip) => {
        const source = trip.stops.find((stop) => stopId(stop) === id);
        if (!source) return trip;
        return {
          ...trip,
          stops: trip.stops.map((stop) =>
            placeKey(stop) === placeKey(source)
              ? { ...stop, availability }
              : stop,
          ),
        };
      }),
  };
};
