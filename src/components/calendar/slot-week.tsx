import dynamic from "next/dynamic";
import type {
  EventDropInfo,
  EventInput,
  EventResizeDoneInfo,
} from "@fullcalendar/react";
import type { TimeSlot } from "@/types/trip-api";
import {
  DAY,
  type SlotTime,
  atMinute,
  dayOf,
  slotAt,
  slotBetween,
} from "./calendar-time";
import { toBusinessHours } from "./open-hours";
import type { SlotSchedule } from "./use-slot-schedule";
import { selectedEventClass } from "./week-calendar-theme";

// Client-only: Node and browser ICU format date ranges with different
// whitespace (thin vs regular spaces), which breaks hydration of the title.
const WeekCalendar = dynamic(
  () => import("./week-calendar").then((m) => m.WeekCalendar),
  { ssr: false },
);

const invalidColors = {
  color: "var(--color-red-500)",
  contrastColor: "var(--color-red-900)",
};

/** The trip's days as a rolling week. Drop, drag or click to place time slots. */
export function SlotWeek({
  schedule,
  selectedId,
  disabled,
  onSelect,
  onPlace,
}: {
  schedule: SlotSchedule;
  selectedId?: string;
  disabled: boolean;
  onSelect: (stopId: string) => void;
  onPlace: (stopId: string, time: SlotTime) => boolean;
}) {
  const { dates } = schedule;
  const openHours =
    (selectedId && schedule.stopsById.get(selectedId)?.availability) || [];

  const toEvent = (slot: TimeSlot): EventInput => {
    const name = schedule.nameOf(slot.stopId);
    return {
      id: slot.id,
      title: slot.locked ? `Reserved · ${name}` : name,
      start: atMinute(slot.date, slot.startMinute),
      end: atMinute(slot.date, slot.endMinute),
      editable: !disabled && !slot.locked,
      extendedProps: { stopId: slot.stopId },
      className: slot.stopId === selectedId ? selectedEventClass : undefined,
      ...(!schedule.isValid(slot) && invalidColors),
    };
  };
  const moveSlot = ({ event, revert }: EventDropInfo | EventResizeDoneInfo) => {
    if (!event.start || !event.end) return revert();
    const placed = onPlace(
      event.extendedProps.stopId,
      slotBetween(event.start, event.end),
    );
    if (!placed) revert();
  };

  return (
    <WeekCalendar
      key={dates[0]}
      initialDate={dates[0]}
      initialView="timeGridRollingWeek"
      validRange={{
        start: dates[0],
        end: dayOf(atMinute(dates.at(-1)!, DAY)),
      }}
      titleFormat={{ month: "short", day: "numeric" }}
      headerToolbar={{ start: "title", end: "prev,next" }}
      editable={!disabled}
      droppable={!disabled}
      // Shade closed times for the selected stop.
      businessHours={toBusinessHours(openHours)}
      events={schedule.slots.map(toEvent)}
      eventClick={({ event }) => {
        if (!disabled) onSelect(event.extendedProps.stopId);
      }}
      dateClick={({ date }) => {
        if (selectedId)
          onPlace(selectedId, slotAt(date, schedule.lengthOf(selectedId)));
      }}
      eventAllow={({ start, end }, event) =>
        !!event &&
        !!schedule.fit(event.extendedProps.stopId, slotBetween(start, end))
      }
      eventDrop={moveSlot}
      eventResize={moveSlot}
      eventReceive={({ event, revert }) => {
        // The draft owns events. Discard FullCalendar's temporary copy.
        revert();
        const id = event.extendedProps.stopId;
        if (event.start)
          onPlace(id, slotAt(event.start, schedule.lengthOf(id)));
      }}
    />
  );
}
