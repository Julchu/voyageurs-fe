"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { Cursor } from "@dnd-kit/dom";
import { useShallow } from "zustand/react/shallow";
import {
  useTripStopSortable,
  useTripStopSorting,
} from "@/hooks/use-trip-stop-sorting";
import { useTripDraft } from "@/hooks/use-trip-draft";
import { useTripStore } from "@/providers/trip-store-provider";
import { StopDragHandle } from "@/components/trips-drawer/stop-drag-controls";
import type { TripStopDraft } from "@/types/trip-draft";
import Link from "next/link";
import { Draggable } from "@fullcalendar/react/interaction";
import type { EventDropInfo, EventResizeDoneInfo } from "@fullcalendar/react";
import { Button } from "@base-ui/react/button";
import type { ScheduledVisit } from "@/types/trip-api";
import { canSchedule } from "@/utils/trip-time";
import { dateDays, timeLabel } from "@/utils/trip-calendar";
import { stopId } from "@/utils/trip-stop";
import { AvailabilityGrid } from "./availability-grid";
import { EditorFooter } from "@/components/ui/editor-footer";
import { calendarButton } from "./styles";
import {
  atMinute,
  calendarSlot,
  dayOf,
  minuteOf,
  visitDuration,
} from "./calendar-time";
import dynamic from "next/dynamic";
import { VisitFields } from "./visit-fields";
import { TripDateRange } from "./trip-date-range";
import { selectedEventClass } from "./week-calendar-theme";
import { Separator } from "@base-ui/react/separator";

// Client-only: Node and browser ICU format date ranges with different
// whitespace (thin vs regular spaces), which breaks hydration of the title.
const WeekCalendar = dynamic(
  () => import("./week-calendar").then((m) => m.WeekCalendar),
  { ssr: false },
);

type Placement = { stopId: string };
const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

// List reorders show a vertical cursor; dragging a card body onto the calendar keeps its own.
const reorderPlugins = <T,>(defaults: T[]) => [
  ...defaults.filter((plugin) => plugin !== Cursor),
  Cursor.configure({ cursor: "ns-resize" }),
];

export function TripCalendar() {
  const clientId = useTripStore(({ currentTrip }) => currentTrip?.clientId);
  return <CalendarEditor key={clientId ?? "empty"} />;
}

/** Schedules the same trip draft the drawer edits. Visit times also set the stop order. */
function CalendarEditor() {
  const { trip, isDirty, isSaving, canSave, save, reset } = useTripDraft();
  const { handleDragEnd } = useTripStopSorting();
  const {
    addStop,
    setTripDates,
    setVisit,
    removeVisit: deleteVisit,
    toggleReserved,
    setOpenHours,
  } = useTripStore(
    useShallow((state) => ({
      addStop: state.addStop,
      setTripDates: state.setTripDates,
      setVisit: state.setVisit,
      removeVisit: state.removeVisit,
      toggleReserved: state.toggleReserved,
      setOpenHours: state.setOpenHours,
    })),
  );
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const stopList = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!stopList.current) return;
    const draggable = new Draggable(stopList.current, {
      itemSelector: "[data-calendar-stop]",
      eventData: (el) => ({
        title: el.dataset.name,
        duration: { minutes: Number(el.dataset.duration) },
        extendedProps: { stopId: el.dataset.calendarStop },
      }),
    });
    return () => draggable.destroy();
  }, []);
  const stops = trip?.stops ?? [];
  const visits = trip?.visits ?? [];
  const startDate = trip?.startDate ?? null;
  const endDate = trip?.endDate ?? null;
  const hoursOf = (id: string) =>
    stops.find((stop) => stopId(stop) === id)?.availability ?? [];
  const visitOf = (id: string) => visits.find((visit) => visit.stopId === id);
  const editingStop = stops.find((stop) => stopId(stop) === editingStopId);
  const selectedStop = stops.find((stop) => stopId(stop) === placement?.stopId);
  const selectedVisit = placement ? visitOf(placement.stopId) : undefined;
  const selectedOpenHours = selectedStop?.availability ?? [];
  const dates = startDate && endDate ? dateDays(startDate, endDate) : [];
  const outsideDates = visits.filter((visit) => !dates.includes(visit.date));
  const invalid =
    (!!(startDate || endDate) && !dates.length) ||
    outsideDates.length > 0 ||
    visits.some((visit) => !canSchedule(visits, visit, hoursOf(visit.stopId)));

  // TODO: Add styled feedback for invalid dates, unavailable times, and rejected drops.

  const visitLength = (id: string) => {
    const visit = visitOf(id);
    return visit ? visitDuration(visit) : 30;
  };
  /** The visit a drop or form would make, or null if it doesn't fit. Visits stay within one day. */
  const candidate = (
    id: string,
    date: string,
    startMinute: number,
    length: number,
  ): ScheduledVisit | null => {
    const previous = visitOf(id);
    const endMinute = startMinute + length;
    if (
      isSaving ||
      previous?.locked ||
      !dates.includes(date) ||
      !Number.isFinite(length) ||
      length < 30 ||
      endMinute > 1440 ||
      !stops.some((stop) => stopId(stop) === id)
    )
      return null;
    const visit = {
      id: previous?.id ?? "",
      locked: false,
      stopId: id,
      date,
      startMinute,
      endMinute,
    };
    return canSchedule(visits, visit, hoursOf(id)) ? visit : null;
  };
  const place = (id: string, date: string, start: number, length: number) => {
    const visit = candidate(id, date, start, length);
    if (!visit) return false;
    setVisit({ ...visit, id: visit.id || crypto.randomUUID() });
    setPlacement({ stopId: id });
    return true;
  };
  const changeEvent = ({
    event,
    revert,
  }: EventDropInfo | EventResizeDoneInfo) => {
    if (!event.start || !event.end) return revert();
    const { date, startMinute, endMinute } = calendarSlot(
      event.start,
      event.end,
    );
    if (
      !place(
        event.extendedProps.stopId,
        date,
        startMinute,
        endMinute - startMinute,
      )
    )
      revert();
  };
  const removeVisit = (id: string) => {
    deleteVisit(id);
    if (selectedVisit?.id === id) setPlacement(null);
  };
  // A duplicate is just another stop at the same place.
  const duplicateStop = (stop: TripStopDraft) => {
    const id = addStop(stop);
    if (!id) return;
    setPlacement({ stopId: id });
    setEditingStopId(null);
  };

  return (
    <section
      aria-label="Trip calendar"
      className="group/cal flex h-full min-h-0 flex-col overflow-hidden text-neutral-900"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-none md:flex md:overflow-hidden">
        <div className="flex min-h-144 flex-1 flex-col md:min-h-0 md:flex-row">
          <aside
            className="flex max-h-40 shrink-0 flex-col border-b border-neutral-100 md:max-h-none md:w-60 md:border-r md:border-b-0 lg:w-64"
            aria-label="Trip stops"
          >
            <div className="flex w-full flex-wrap p-2">
              <TripDateRange
                startDate={startDate}
                endDate={endDate}
                disabled={isSaving}
                onChange={setTripDates}
              />
            </div>

            <Separator className={"h-px bg-gray-200"} />

            <DragDropProvider
              onDragEnd={handleDragEnd}
              plugins={reorderPlugins}
            >
              <ul
                ref={stopList}
                className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-none p-2 transition-colors has-[[data-dnd-dragging]]:bg-blue-50 has-[[data-dnd-dragging]]:ring-1 has-[[data-dnd-dragging]]:ring-blue-200 has-[[data-dnd-dragging]]:ring-inset"
              >
                {stops.map((stop, index) => {
                  const id = stopId(stop);
                  const visit = visitOf(id);
                  const active =
                    editingStopId === id || placement?.stopId === id;
                  return (
                    <SortableCalendarStop
                      key={stop.clientId}
                      stop={stop}
                      index={index}
                      className={`rounded-xl border p-2.5 transition-colors ${active ? "border-blue-300 bg-blue-50" : visit ? "border-neutral-100 bg-neutral-50" : "border-neutral-200 bg-white"}`}
                    >
                      <Button
                        type="button"
                        data-calendar-stop={
                          !isSaving &&
                          !visit?.locked &&
                          !editingStop &&
                          dates.length
                            ? id
                            : undefined
                        }
                        data-name={stop.name}
                        data-duration={visitLength(id)}
                        disabled={isSaving}
                        onClick={() => {
                          setPlacement({ stopId: id });
                          setEditingStopId(null);
                        }}
                        aria-pressed={placement?.stopId === id && !editingStop}
                        className="flex w-full cursor-s-resize gap-2 text-left outline-blue-500 disabled:cursor-default md:cursor-e-resize"
                      >
                        <span
                          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] ${visit ? "bg-neutral-200 text-neutral-500" : "bg-blue-100 text-blue-600"}`}
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          <span
                            className={`block text-xs leading-relaxed font-medium ${visit && !active ? "text-neutral-500" : "text-neutral-800"}`}
                          >
                            {stop.name}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-neutral-400">
                            {visit
                              ? `${shortDate(visit.date)} · ${timeLabel(visit.startMinute)}–${timeLabel(visit.endMinute)}`
                              : "Not scheduled"}
                          </span>
                        </span>
                      </Button>
                      <Button
                        type="button"
                        disabled={isSaving}
                        onClick={() => duplicateStop(stop)}
                        aria-label={`Duplicate ${stop.name}`}
                        className="mt-2 ml-7 text-[10px] font-medium text-blue-600 hover:underline focus-visible:outline-blue-500 disabled:opacity-50"
                      >
                        Duplicate stop
                      </Button>
                      <Button
                        type="button"
                        disabled={isSaving}
                        className="mt-2 ml-7 text-[10px] font-medium text-blue-600 hover:underline focus-visible:outline-blue-500"
                        onClick={() => {
                          setEditingStopId(id);
                          setPlacement(null);
                        }}
                      >
                        Edit open hours
                      </Button>
                    </SortableCalendarStop>
                  );
                })}
                {!stops.length && (
                  <li className="px-1 py-3 text-xs leading-relaxed text-neutral-500">
                    Add places from the{" "}
                    <Link href="/" className="text-blue-600 underline">
                      map
                    </Link>
                    , or choose a trip in the drawer.
                  </li>
                )}
              </ul>
            </DragDropProvider>
          </aside>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white *:transition-opacity group-has-[[data-dnd-dragging]]/cal:pointer-events-none group-has-[[data-dnd-dragging]]/cal:*:opacity-30">
            {editingStop ? (
              <>
                <div className="shrink-0 space-y-3 border-b border-neutral-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-medium tracking-wide text-blue-600 uppercase">
                        Weekly open hours
                      </p>
                      <h2 className="mt-1 text-sm font-semibold">
                        {editingStop.name}
                      </h2>
                    </div>
                    <Button
                      type="button"
                      className={calendarButton}
                      onClick={() => setEditingStopId(null)}
                    >
                      Back to trip calendar
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="max-w-xl text-xs leading-relaxed text-neutral-500">
                      Select a continuous time range to mark it open. Drag or
                      resize a block across days to change it. With no open
                      hours, this stop is available anytime. Times are local
                      trip time.
                    </p>
                    <Button
                      type="button"
                      disabled={isSaving || !editingStop.availability.length}
                      className={calendarButton}
                      onClick={() => setOpenHours(stopId(editingStop), [])}
                    >
                      Clear open hours
                    </Button>
                  </div>
                </div>
                <AvailabilityGrid
                  key={stopId(editingStop)}
                  windows={editingStop.availability}
                  disabled={isSaving}
                  onChange={(windows) =>
                    setOpenHours(stopId(editingStop), windows)
                  }
                />
              </>
            ) : (
              <>
                <div className="shrink-0 space-y-3 border-b border-neutral-100 p-4">
                  {selectedStop ? (
                    <VisitFields
                      key={[
                        stopId(selectedStop),
                        selectedVisit?.date,
                        selectedVisit?.startMinute,
                        selectedVisit?.endMinute,
                        selectedVisit?.locked,
                        dates[0],
                        dates.at(-1),
                      ].join(":")}
                      name={selectedStop.name}
                      visit={selectedVisit}
                      dates={dates}
                      disabled={isSaving}
                      onPlace={(date, start, length) =>
                        place(stopId(selectedStop), date, start, length)
                      }
                      onReserve={() =>
                        selectedVisit && toggleReserved(selectedVisit.id)
                      }
                      onRemove={() =>
                        selectedVisit && removeVisit(selectedVisit.id)
                      }
                    />
                  ) : (
                    <p className="text-xs text-neutral-500">
                      Select a stop, then choose a time. All times are local to
                      your trip.
                    </p>
                  )}
                </div>
                {dates.length ? (
                  <WeekCalendar
                    key={dates[0]}
                    initialDate={dates[0]}
                    initialView="timeGridRollingWeek"
                    validRange={{
                      start: dates[0],
                      end: dayOf(atMinute(dates[dates.length - 1], 1440)),
                    }}
                    titleFormat={{ month: "short", day: "numeric" }}
                    headerToolbar={{ start: "title", end: "prev,next" }}
                    editable={!isSaving}
                    droppable={!isSaving}
                    // Shade closed times for the selected stop. No hours = open anytime.
                    businessHours={
                      selectedOpenHours.length
                        ? selectedOpenHours.map((w) => ({
                            daysOfWeek: [w.day],
                            startTime: timeLabel(w.startMinute),
                            endTime: timeLabel(w.endMinute),
                          }))
                        : false
                    }
                    events={visits.map((visit) => {
                      const valid = canSchedule(
                        visits,
                        visit,
                        hoursOf(visit.stopId),
                      );
                      const name =
                        stops.find((s) => stopId(s) === visit.stopId)?.name ??
                        "Removed stop";
                      return {
                        id: visit.id,
                        title: visit.locked ? "Reserved · " + name : name,
                        start: atMinute(visit.date, visit.startMinute),
                        end: atMinute(visit.date, visit.endMinute),
                        editable: !isSaving && !visit.locked,
                        extendedProps: { stopId: visit.stopId },
                        ...(!valid && {
                          color: "var(--color-red-500)",
                          contrastColor: "var(--color-red-900)",
                        }),
                        className:
                          placement?.stopId === visit.stopId
                            ? selectedEventClass
                            : undefined,
                        ...(!valid && {
                          color: "#fef2f2",
                          contrastColor: "#991b1b",
                        }),
                      };
                    })}
                    eventClick={({ event }) => {
                      if (!isSaving)
                        setPlacement({ stopId: event.extendedProps.stopId });
                    }}
                    dateClick={({ date }) => {
                      if (placement)
                        place(
                          placement.stopId,
                          dayOf(date),
                          minuteOf(date),
                          visitLength(placement.stopId),
                        );
                    }}
                    eventAllow={({ start, end }, event) => {
                      const { date, startMinute, endMinute } = calendarSlot(
                        start,
                        end,
                      );
                      return (
                        !!event &&
                        !!candidate(
                          event.extendedProps.stopId,
                          date,
                          startMinute,
                          endMinute - startMinute,
                        )
                      );
                    }}
                    eventDrop={changeEvent}
                    eventResize={changeEvent}
                    eventReceive={({ event, revert }) => {
                      // The draft owns events. Discard FullCalendar's temporary copy.
                      revert();
                      if (event.start)
                        place(
                          event.extendedProps.stopId,
                          dayOf(event.start),
                          minuteOf(event.start),
                          visitLength(event.extendedProps.stopId),
                        );
                    }}
                  />
                ) : (
                  <div className="flex min-h-48 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                    <div
                      className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-500"
                      aria-hidden="true"
                    >
                      📅
                    </div>
                    <h2 className="text-sm font-medium">
                      Give your trip a little time.
                    </h2>
                    <p className="max-w-sm text-xs leading-relaxed text-neutral-500">
                      Choose a start and end date to begin planning. You can
                      edit each stop’s weekly open hours anytime.
                    </p>
                  </div>
                )}
                {outsideDates.length > 0 && (
                  <div className="max-h-32 shrink-0 overflow-auto overscroll-none border-t border-amber-100 bg-amber-50 px-4 py-3">
                    <p className="mb-2 text-xs text-amber-800">
                      Visits outside the selected dates
                    </p>
                    {outsideDates.map((visit) => (
                      <div
                        key={visit.id}
                        className="flex items-center justify-between gap-2 py-1 text-xs text-amber-900"
                      >
                        <span>
                          {
                            stops.find((stop) => stopId(stop) === visit.stopId)
                              ?.name
                          }{" "}
                          · {visit.date} · {timeLabel(visit.startMinute)}
                        </span>
                        <Button
                          type="button"
                          className="underline"
                          disabled={isSaving}
                          onClick={() => removeVisit(visit.id)}
                        >
                          Remove visit
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <EditorFooter
        isDirty={isDirty}
        isEditing={editingStopId !== null || placement !== null}
        isSaving={isSaving}
        canSave={canSave && !invalid}
        onSave={() => void save()}
        onReset={() => {
          reset();
          setPlacement(null);
          setEditingStopId(null);
        }}
      />
    </section>
  );
}

function SortableCalendarStop({
  stop,
  index,
  className,
  children,
}: {
  stop: TripStopDraft;
  index: number;
  className: string;
  children: ReactNode;
}) {
  const {
    ref,
    handleRef,
    isDragging,
    disabled: dragDisabled,
  } = useTripStopSortable(stop, index);

  return (
    <li
      ref={ref}
      className={`${className} flex items-center gap-1 ${isDragging ? "opacity-50" : ""}`}
    >
      <StopDragHandle
        name={stop.name}
        handleRef={handleRef}
        disabled={dragDisabled}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
