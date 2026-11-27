import { type ReactNode, useEffect, useEffectEvent, useRef } from "react";
import Link from "next/link";
import { Button } from "@base-ui/react/button";
import { cn } from "cn";
import { Cursor } from "@dnd-kit/dom";
import { Draggable } from "@fullcalendar/react/interaction";
import type { PointerDragEvent } from "@fullcalendar/react/protected-api";
import {
  StopDragHandle,
  StopDragProvider,
} from "@/components/trips-drawer/stop-drag-controls";
import { stopNumber } from "@/components/ui/button-styles";
import { ClockIcon, CopyIcon } from "@/components/ui/icons/planner-icons";
import {
  useStopSortable,
  useTripStopSorting,
} from "@/hooks/use-trip-stop-sorting";
import type { TimeSlot } from "@/types/trip-api";
import type { TripStopDraft } from "@/types/trip-draft";
import { dateLabel, timeLabel } from "@/utils/trip-time";
import { stopId } from "@/utils/trip-stop";
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

// TODO: styled tooltips for the icon buttons (title attribute for now).
const iconButton =
  "flex size-8 cursor-pointer items-center justify-center rounded-lg text-neutral-500 transition-colors outline-blue-500 hover:bg-white hover:text-blue-500 hover:shadow-sm aria-pressed:bg-white aria-pressed:text-blue-500 aria-pressed:shadow-sm disabled:cursor-not-allowed disabled:opacity-40";

/** Sortable stops. Card bodies also drag onto the calendar to add a time slot. */
export function CalendarStopList({
  schedule,
  activeId,
  selectedId,
  canDrag,
  disabled,
  onSelect,
  onDragStart,
  onEditHours,
  onDuplicate,
}: {
  schedule: SlotSchedule;
  activeId?: string;
  selectedId?: string;
  canDrag: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
  /** A card body started dragging toward the calendar. Must bring the calendar into view synchronously. */
  onDragStart: () => void;
  onEditHours: (id: string) => void;
  onDuplicate: (stop: TripStopDraft) => void;
}) {
  const { handleDragEnd, handleDragOver } = useTripStopSorting();
  const list = useRef<HTMLUListElement>(null);
  const startDrag = useEffectEvent(onDragStart);
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
    const { emitter } = draggable.dragging;
    emitter.on("dragstart", (ev: PointerDragEvent) => {
      startDrag();
      // FullCalendar measures drop slots on touch-down; re-measure now the calendar may have moved into view.
      emitter.trigger("pointerup", ev);
      emitter.trigger("pointerdown", ev);
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
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-none px-2 pb-3 transition-colors has-[[data-dnd-dragging]]:bg-blue-50/50 md:px-3"
      >
        {schedule.stops.map((stop, index) => {
          const id = stopId(stop);
          const slot = schedule.slotsByStop.get(id);
          const active = activeId === id;
          const placing = selectedId === id && !slot;
          return (
            <SortableCalendarStop
              key={stop.clientId}
              stop={stop}
              index={index}
              busy={disabled}
              locked={!!slot?.locked}
              className={cn(
                "rounded-2xl border px-1.5 py-2 transition-colors",
                active
                  ? cn("border-blue-300 bg-blue-50", placing && "border-dashed")
                  : "border-transparent hover:bg-neutral-50",
              )}
            >
              <Button
                type="button"
                data-calendar-stop={canDrag && !slot?.locked ? id : undefined}
                data-name={stop.name}
                data-duration={schedule.lengthOf(id)}
                disabled={disabled}
                onClick={() => onSelect(id)}
                aria-pressed={selectedId === id}
                className="flex min-w-0 flex-1 cursor-s-resize items-center gap-3 text-left outline-blue-500 disabled:cursor-default md:cursor-e-resize"
              >
                <span className={cn(stopNumber(!!slot), "size-7 text-xs")}>
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-neutral-900">
                    {stop.name}
                  </span>
                  <span
                    className={cn(
                      "block truncate text-xs",
                      placing
                        ? "text-blue-500"
                        : slot
                          ? "text-neutral-500"
                          : "text-amber-600",
                    )}
                  >
                    {placing ? "Tap an open slot" : slotLabel(slot)}
                  </span>
                </span>
              </Button>
              <Button
                type="button"
                disabled={disabled}
                onClick={() => onDuplicate(stop)}
                aria-label={`Duplicate ${stop.name}`}
                title="Duplicate stop"
                className={iconButton}
              >
                <CopyIcon aria-hidden="true" className="size-4.5" />
              </Button>
              <Button
                type="button"
                disabled={disabled}
                onClick={() => onEditHours(id)}
                aria-label={`Open hours for ${stop.name}`}
                aria-pressed={active && selectedId !== id}
                title="Open hours"
                className={iconButton}
              >
                <ClockIcon aria-hidden="true" className="size-4.5" />
              </Button>
            </SortableCalendarStop>
          );
        })}
        {!schedule.stops.length && (
          <li className="px-2 py-3 text-sm leading-relaxed text-neutral-500">
            Add places from the{" "}
            <Link href="/" className="text-blue-500 underline">
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
  // dnd-kit moves the ref element while sorting, so it must be the list's own child.
  return (
    <li ref={ref}>
      <div
        className={cn(
          className,
          "flex items-center gap-1",
          isDragging && "opacity-50",
        )}
      >
        <StopDragHandle
          name={stop.name}
          handleRef={handleRef}
          disabled={disabled}
        />
        {children}
      </div>
    </li>
  );
}
