import { useTripStore } from "@/providers/trip-store-provider";
import type { TimeSlot } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import { stopId } from "@/utils/trip-stop";
import {
  DAY_MINUTES as DAY,
  canSchedule,
  dateDays,
  slotDuration,
} from "@/utils/trip-time";
import type { SlotTime } from "./calendar-time";

const MIN_SLOT = 30;

/** Lookups and placement rules for a trip's time slots. Each stays within one trip day. */
export function useSlotSchedule(
  trip: TripDraft | undefined,
  disabled: boolean,
) {
  const setTimeSlot = useTripStore((state) => state.setTimeSlot);
  const stops = trip?.stops ?? [];
  const slots = trip?.timeSlots ?? [];
  const startDate = trip?.startDate ?? null;
  const endDate = trip?.endDate ?? null;
  const dates = startDate && endDate ? dateDays(startDate, endDate) : [];

  const stopsById = new Map(stops.map((stop) => [stopId(stop), stop]));
  const slotsByStop = new Map(slots.map((slot) => [slot.stopId, slot]));
  const nameOf = (id: string) => stopsById.get(id)?.name ?? "Removed stop";
  const isValid = (slot: TimeSlot) =>
    canSchedule(slots, slot, stopsById.get(slot.stopId)?.availability ?? []);
  const lengthOf = (id: string) => {
    const slot = slotsByStop.get(id);
    return slot ? slotDuration(slot) : MIN_SLOT;
  };

  /** The stop's time slot at this time, or null if it doesn't fit. */
  const fit = (id: string, { date, startMinute, endMinute }: SlotTime) => {
    const previous = slotsByStop.get(id);
    const length = endMinute - startMinute;
    if (
      disabled ||
      previous?.locked ||
      !stopsById.has(id) ||
      !dates.includes(date) ||
      !Number.isFinite(length) ||
      length < MIN_SLOT ||
      endMinute > DAY
    )
      return null;
    const slot: TimeSlot = {
      id: previous?.id ?? "",
      locked: false,
      stopId: id,
      date,
      startMinute,
      endMinute,
    };
    return isValid(slot) ? slot : null;
  };

  const place = (id: string, time: SlotTime) => {
    const slot = fit(id, time);
    if (slot) setTimeSlot({ ...slot, id: slot.id || crypto.randomUUID() });
    return !!slot;
  };

  const outsideDates = slots.filter((slot) => !dates.includes(slot.date));
  const hasErrors =
    (!!(startDate || endDate) && !dates.length) ||
    outsideDates.length > 0 ||
    slots.some((slot) => !isValid(slot));

  return {
    stops,
    slots,
    startDate,
    endDate,
    dates,
    stopsById,
    slotsByStop,
    outsideDates,
    hasErrors,
    nameOf,
    isValid,
    lengthOf,
    fit,
    place,
  };
}

export type SlotSchedule = ReturnType<typeof useSlotSchedule>;
