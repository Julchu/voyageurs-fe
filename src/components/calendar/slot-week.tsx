import { type ReactNode, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@base-ui/react/button";
import { useMediaQuery } from "@base-ui/react/unstable-use-media-query";
import type {
  CalendarApi,
  EventDropInfo,
  EventInput,
  EventResizeDoneInfo,
} from "@fullcalendar/react";
import { cn } from "cn";
import { circleButton } from "@/components/ui/button-styles";
import { CaretDownIcon } from "@/components/ui/icons/caret-icons";
import { XIcon } from "@/components/ui/icons/close-icons";
import type { TimeSlot } from "@/types/trip-api";
import {
  DAY_MINUTES as DAY,
  SLOT_MINUTES,
  atMinute,
  dayOf,
} from "@/utils/trip-time";
import { type SlotTime, slotAt, slotBetween } from "./calendar-time";
import { toBusinessHours } from "./open-hours";
import type { SlotSchedule } from "./use-slot-schedule";
import { selectedEventClass } from "./week-calendar-theme";

// Client-only: Node and browser ICU format date ranges with different
// whitespace (thin vs regular spaces), which breaks hydration of date labels.
const WeekCalendar = dynamic(
  () => import("./week-calendar").then((m) => m.WeekCalendar),
  { ssr: false },
);

const invalidColors = {
  color: "var(--color-red-500)",
  contrastColor: "var(--color-red-900)",
};

type Shown = { start: string; end: string; api: CalendarApi };

/** The trip's days as a rolling week (3 days on phones, 4 on tablets). Drop, drag or click to place time slots. */
export function SlotWeek({
  schedule,
  selectedId,
  disabled,
  banner,
  onSelect,
  onPlace,
  onRemove,
}: {
  schedule: SlotSchedule;
  selectedId?: string;
  disabled: boolean;
  /** Shown in the header, beside the day arrows. */
  banner?: ReactNode;
  onSelect: (stopId: string) => void;
  onPlace: (stopId: string, time: SlotTime) => boolean;
  onRemove: (slot: TimeSlot) => void;
}) {
  const isTablet = useMediaQuery("(min-width: 768px)", {
    defaultMatches: false,
  });
  const isWide = useMediaQuery("(min-width: 1280px)", {
    defaultMatches: false,
  });
  const view = `timeGridRolling${isWide ? 7 : isTablet ? 4 : 3}`;
  const [shown, setShown] = useState<Shown>();
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
      extendedProps: { slot, stopId: slot.stopId },
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
    <>
      <div className="flex shrink-0 items-center gap-2 px-4 py-3 md:gap-3 md:px-6 md:py-4">
        {banner}
        <div className="ml-auto flex shrink-0 gap-2">
          <Button
            aria-label="Earlier days"
            className={circleButton}
            disabled={!shown || shown.start <= dates[0]}
            onClick={() => shown?.api.prev()}
          >
            <CaretDownIcon className="size-5 rotate-90 fill-none stroke-current" />
          </Button>
          <Button
            aria-label="Later days"
            className={circleButton}
            disabled={!shown || shown.end > dates.at(-1)!}
            onClick={() => shown?.api.next()}
          >
            <CaretDownIcon className="size-5 -rotate-90 fill-none stroke-current" />
          </Button>
        </div>
      </div>
      <WeekCalendar
        key={`${dates[0]}-${view}`}
        initialDate={dates[0]}
        initialView={view}
        validRange={{
          start: dates[0],
          end: dayOf(atMinute(dates.at(-1)!, DAY)),
        }}
        // Fires in FullCalendar's mount, before this component's first commit
        // finishes, so defer the state update.
        datesSet={({ view }) => {
          const next = {
            start: dayOf(view.currentStart),
            end: dayOf(view.currentEnd),
            api: view.calendar,
          };
          queueMicrotask(() => setShown(next));
        }}
        editable={!disabled}
        droppable={!disabled}
        // Shade closed times for the selected stop.
        businessHours={toBusinessHours(openHours)}
        events={schedule.slots.map(toEvent)}
        eventContent={({ event, timeText }) => {
          // A 30-minute slot only fits the name; longer slots add the time below.
          const long =
            (event.end?.getTime() ?? 0) - (event.start?.getTime() ?? 0) >
            SLOT_MINUTES * 60_000;
          // Hover shows remove on desktop; touch shows it once the stop is selected.
          const selected = event.extendedProps.stopId === selectedId;
          return (
            <div className="flex h-full min-w-0 flex-col">
              <div className="min-w-0 leading-tight">
                <div
                  className={cn(
                    "text-xs font-bold wrap-break-word",
                    long ? "line-clamp-4" : "truncate",
                  )}
                >
                  {event.title}
                </div>
                {long && (
                  <div className="truncate text-[11px] font-semibold text-[color-mix(in_oklab,var(--fc-event-color)_75%,black)]">
                    {timeText}
                  </div>
                )}
              </div>
              {!disabled && (
                <button
                  type="button"
                  data-remove
                  aria-label={`Remove ${event.title}`}
                  className={cn(
                    "absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-white/90 text-neutral-500 hover:text-red-600",
                    !selected &&
                      "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                  )}
                >
                  <XIcon
                    aria-hidden="true"
                    className="size-3.5 stroke-current"
                  />
                </button>
              )}
            </div>
          );
        }}
        // FullCalendar has no remove action, and its native click listener runs
        // before React's, so the event's X is handled here.
        eventClick={({ event, jsEvent }) => {
          if (disabled) return;
          if ((jsEvent.target as Element).closest("[data-remove]"))
            onRemove(event.extendedProps.slot);
          else onSelect(event.extendedProps.stopId);
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
    </>
  );
}
