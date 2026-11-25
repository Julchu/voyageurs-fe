import { type ReactNode, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@base-ui/react/button";
import { Cursor } from "@dnd-kit/dom";
import { Draggable } from "@fullcalendar/react/interaction";
import {
  StopDragHandle,
  StopDragProvider,
} from "@/components/trips-drawer/stop-drag-controls";
import {
  useStopSortable,
  useTripStopSorting,
} from "@/hooks/use-trip-stop-sorting";
import type { TimeSlot } from "@/types/trip-api";
import type { TripStopDraft } from "@/types/trip-draft";
import { dateLabel, timeLabel } from "@/utils/trip-time";
import { stopId } from "@/utils/trip-stop";
import { linkButton } from "./styles";
import type { SlotSchedule } from "./use-slot-schedule";

// List reorders show a vertical cursor; dragging a card body onto the calendar keeps its own.
const reorderPlugins = <T,>(defaults: T[]) => [
  ...defaults.filter((plugin) => plugin !== Cursor),
  Cursor.configure({ cursor: "ns-resize" }),
];

const slotLabel = (slot?: TimeSlot) =>
  slot
    ? `${dateLabel(slot.date, false)} · ${timeLabel(slot.startMinute)}–${timeLabel(slot.endMinute)}`
    : "Not scheduled";

/** Sortable stops. Card bodies also drag onto the calendar to add a time slot. */
export function CalendarStopList({
  schedule,
  activeId,
  selectedId,
  canDrag,
  disabled,
  onSelect,
  onEditHours,
  onDuplicate,
}: {
  schedule: SlotSchedule;
  activeId?: string;
  selectedId?: string;
  canDrag: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
  onEditHours: (id: string) => void;
  onDuplicate: (stop: TripStopDraft) => void;
}) {
  const { handleDragEnd, handleDragOver } = useTripStopSorting();
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!list.current) return;
    const draggable = new Draggable(list.current, {
      itemSelector: "[data-calendar-stop]",
      eventData: (el) => ({
        title: el.dataset.name,
        duration: { minutes: Number(el.dataset.duration) },
        extendedProps: { stopId: el.dataset.calendarStop },
      }),
    });
    return () => draggable.destroy();
  }, []);

  return (
    <StopDragProvider
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      plugins={reorderPlugins}
    >
      <ul
        ref={list}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-none p-2 transition-colors has-[[data-dnd-dragging]]:bg-blue-50 has-[[data-dnd-dragging]]:ring-1 has-[[data-dnd-dragging]]:ring-blue-200 has-[[data-dnd-dragging]]:ring-inset"
      >
        {schedule.stops.map((stop, index) => {
          const id = stopId(stop);
          const slot = schedule.slotsByStop.get(id);
          const active = activeId === id;
          return (
            <SortableCalendarStop
              key={stop.clientId}
              stop={stop}
              index={index}
              busy={disabled}
              locked={!!slot?.locked}
              className={`rounded-xl border p-2.5 transition-colors ${active ? "border-blue-300 bg-blue-50" : slot ? "border-neutral-100 bg-neutral-50" : "border-neutral-200 bg-white"}`}
            >
              <Button
                type="button"
                data-calendar-stop={canDrag && !slot?.locked ? id : undefined}
                data-name={stop.name}
                data-duration={schedule.lengthOf(id)}
                disabled={disabled}
                onClick={() => onSelect(id)}
                aria-pressed={selectedId === id}
                className="flex w-full cursor-s-resize gap-2 text-left outline-blue-500 disabled:cursor-default md:cursor-e-resize"
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] ${slot ? "bg-neutral-200 text-neutral-500" : "bg-blue-100 text-blue-600"}`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-xs leading-relaxed font-medium ${slot && !active ? "text-neutral-500" : "text-neutral-800"}`}
                  >
                    {stop.name}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-neutral-400">
                    {slotLabel(slot)}
                  </span>
                </span>
              </Button>
              <div className="mt-2 ml-7 flex gap-3">
                <Button
                  type="button"
                  disabled={disabled}
                  onClick={() => onDuplicate(stop)}
                  aria-label={`Duplicate ${stop.name}`}
                  className={linkButton}
                >
                  Duplicate stop
                </Button>
                <Button
                  type="button"
                  disabled={disabled}
                  onClick={() => onEditHours(id)}
                  className={linkButton}
                >
                  Edit open hours
                </Button>
              </div>
            </SortableCalendarStop>
          );
        })}
        {!schedule.stops.length && (
          <li className="px-1 py-3 text-xs leading-relaxed text-neutral-500">
            Add places from the{" "}
            <Link href="/" className="text-blue-600 underline">
              map
            </Link>
            , or choose a trip in the drawer.
          </li>
        )}
      </ul>
    </StopDragProvider>
  );
}

function SortableCalendarStop({
  stop,
  index,
  busy,
  locked,
  className,
  children,
}: {
  stop: TripStopDraft;
  index: number;
  busy: boolean;
  locked: boolean;
  className: string;
  children: ReactNode;
}) {
  const { ref, handleRef, isDragging, disabled } = useStopSortable(
    stop,
    index,
    { busy, locked },
  );
  return (
    <li
      ref={ref}
      className={`${className} flex items-center gap-1 ${isDragging ? "opacity-50" : ""}`}
    >
      <StopDragHandle
        name={stop.name}
        handleRef={handleRef}
        disabled={disabled}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
