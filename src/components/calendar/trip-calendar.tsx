"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "cn";
import { sectionLabel } from "@/components/ui/button-styles";
import { EditorFooter } from "@/components/ui/editor-footer";
import { useTripDraft } from "@/hooks/use-trip-draft";
import { useTripStore } from "@/providers/trip-store-provider";
import type { TimeSlot } from "@/types/trip-api";
import type { TripStopDraft } from "@/types/trip-draft";
import type { SlotTime } from "./calendar-time";
import { NoDatesState, OutsideDatesNotice } from "./calendar-notices";
import { CalendarStopList } from "./calendar-stop-list";
import { OpenHoursEditor } from "./open-hours-editor";
import { TripDateRange } from "./trip-date-range";
import { useSlotSchedule } from "./use-slot-schedule";
import { SlotFields } from "./slot-fields";
import { SlotWeek } from "./slot-week";

/** The stop being scheduled, or the stop whose open hours are being edited. */
type Focus = { stopId: string; mode: "slot" | "hours" };

export function TripCalendar() {
  const clientId = useTripStore(({ currentTrip }) => currentTrip?.clientId);
  return <CalendarEditor key={clientId ?? "empty"} />;
}

/** Schedules the same trip draft the drawer edits. Time slots also set the stop order. */
function CalendarEditor() {
  const { trip, isDirty, isSaving, canSave, save, reset } = useTripDraft();
  const schedule = useSlotSchedule(trip, isSaving);
  const { addStop, setTripDates, removeTimeSlot, toggleReserved } =
    useTripStore(
      useShallow(
        ({ addStop, setTripDates, removeTimeSlot, toggleReserved }) => ({
          addStop,
          setTripDates,
          removeTimeSlot,
          toggleReserved,
        }),
      ),
    );
  const [focus, setFocus] = useState<Focus | null>(null);
  const { dates } = schedule;
  const focusedStop = focus ? schedule.stopsById.get(focus.stopId) : undefined;
  const editingStop = focus?.mode === "hours" ? focusedStop : undefined;
  const selectedStop = focus?.mode === "slot" ? focusedStop : undefined;
  const selectedId = focus?.mode === "slot" ? focus.stopId : undefined;
  const selectedSlot = selectedId
    ? schedule.slotsByStop.get(selectedId)
    : undefined;

  // TODO: Add styled feedback for invalid dates, unavailable times, and rejected drops.

  const select = (id: string) => setFocus({ stopId: id, mode: "slot" });
  const place = (id: string, time: SlotTime) => {
    const placed = schedule.place(id, time);
    if (placed) select(id);
    return placed;
  };
  const unschedule = (slot: TimeSlot) => {
    removeTimeSlot(slot.id);
    if (slot.stopId === selectedId) setFocus(null);
  };
  // A duplicate is just another stop at the same place.
  const duplicate = (stop: TripStopDraft) => {
    const id = addStop(stop);
    if (id) select(id);
  };

  return (
    <section
      aria-label="Trip calendar"
      className="group/cal flex h-full min-h-0 flex-col overflow-hidden text-neutral-900"
    >
      {/* Phones: stops and calendar split the height 50/50. */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={cn(
            "min-h-0 flex-1 flex-col border-b border-neutral-100 md:w-80 md:flex-none md:border-r md:border-b-0 xl:w-96",
            editingStop ? "hidden md:flex" : "flex",
          )}
          aria-label="Trip stops"
        >
          <div className="shrink-0 p-3 md:p-4">
            <TripDateRange
              startDate={schedule.startDate}
              endDate={schedule.endDate}
              disabled={isSaving}
              onChange={setTripDates}
            />
          </div>
          <div className="flex shrink-0 items-baseline justify-between gap-2 px-4 pb-2 md:px-5">
            <h2 className={sectionLabel}>Trip order</h2>
            <span className="text-xs text-neutral-400 pointer-coarse:hidden">
              Drag to reorder or schedule
            </span>
            <span className="hidden text-xs text-neutral-400 pointer-coarse:inline">
              Hold to drag
            </span>
          </div>
          <CalendarStopList
            schedule={schedule}
            activeId={focus?.stopId}
            selectedId={selectedId}
            canDrag={!isSaving && dates.length > 0 && !editingStop}
            disabled={isSaving}
            onSelect={select}
            onEditHours={(id) => setFocus({ stopId: id, mode: "hours" })}
            onDuplicate={duplicate}
          />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white *:transition-opacity group-has-[[data-dnd-dragging]]/cal:pointer-events-none group-has-[[data-dnd-dragging]]/cal:*:opacity-30">
          {editingStop ? (
            <OpenHoursEditor
              stop={editingStop}
              disabled={isSaving}
              onBack={() => setFocus(null)}
            />
          ) : (
            <>
              {dates.length ? (
                <SlotWeek
                  schedule={schedule}
                  selectedId={selectedId}
                  disabled={isSaving}
                  onSelect={select}
                  onPlace={place}
                  onRemove={unschedule}
                  banner={
                    selectedId &&
                    selectedStop && (
                      <SlotFields
                        key={JSON.stringify([
                          selectedId,
                          dates[0],
                          dates.at(-1),
                        ])}
                        slot={selectedSlot}
                        dates={dates}
                        disabled={isSaving}
                        fits={(time) => !!schedule.fit(selectedId, time)}
                        onPlace={(slot) => place(selectedId, slot)}
                        onReserve={() =>
                          selectedSlot && toggleReserved(selectedSlot.id)
                        }
                        onClose={() => setFocus(null)}
                      />
                    )
                  }
                />
              ) : (
                <NoDatesState />
              )}
              {schedule.outsideDates.length > 0 && (
                <OutsideDatesNotice
                  slots={schedule.outsideDates}
                  nameOf={schedule.nameOf}
                  disabled={isSaving}
                  onRemove={unschedule}
                />
              )}
            </>
          )}
        </div>
      </div>
      <EditorFooter
        isDirty={isDirty}
        isEditing={focus !== null}
        isSaving={isSaving}
        canSave={canSave && !schedule.hasErrors}
        saveLabel={editingStop ? "Save hours" : "Save schedule"}
        onSave={() => void save()}
        onReset={() => {
          reset();
          setFocus(null);
        }}
      />
    </section>
  );
}
