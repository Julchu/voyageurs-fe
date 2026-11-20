import dynamic from "next/dynamic";
import type {
  EventDropInfo,
  EventInput,
  EventResizeDoneInfo,
} from "@fullcalendar/react";
import type { ScheduledVisit } from "@/types/trip-api";
import {
  DAY,
  type Slot,
  atMinute,
  dayOf,
  slotAt,
  slotBetween,
} from "./calendar-time";
import { toBusinessHours } from "./open-hours";
import type { VisitSchedule } from "./use-visit-schedule";
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

/** The trip's days as a rolling week. Drop, drag or click to place visits. */
export function VisitWeek({
  schedule,
  selectedId,
  disabled,
  onSelect,
  onPlace,
}: {
  schedule: VisitSchedule;
  selectedId?: string;
  disabled: boolean;
  onSelect: (stopId: string) => void;
  onPlace: (stopId: string, slot: Slot) => boolean;
}) {
  const { dates } = schedule;
  const openHours =
    (selectedId && schedule.stopsById.get(selectedId)?.availability) || [];

  const toEvent = (visit: ScheduledVisit): EventInput => {
    const name = schedule.nameOf(visit.stopId);
    return {
      id: visit.id,
      title: visit.locked ? `Reserved · ${name}` : name,
      start: atMinute(visit.date, visit.startMinute),
      end: atMinute(visit.date, visit.endMinute),
      editable: !disabled && !visit.locked,
      extendedProps: { stopId: visit.stopId },
      className: visit.stopId === selectedId ? selectedEventClass : undefined,
      ...(!schedule.isValid(visit) && invalidColors),
    };
  };
  const moveVisit = ({
    event,
    revert,
  }: EventDropInfo | EventResizeDoneInfo) => {
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
      events={schedule.visits.map(toEvent)}
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
      eventDrop={moveVisit}
      eventResize={moveVisit}
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
