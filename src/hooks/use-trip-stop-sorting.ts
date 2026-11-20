"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { DragEndEvent } from "@dnd-kit/dom";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { useTripStore } from "@/providers/trip-store-provider";
import type { TripStopDraft } from "@/types/trip-draft";
import { serverTrip } from "@/utils/trip-sync";
import { stopId } from "@/utils/trip-stop";

/** Drag-to-reorder for the drawer and calendar lists. Both move stops in the same draft. */
export function useTripStopSorting() {
  const { trip, moveStop, busy } = useTripStore(
    useShallow((state) => ({
      trip: state.currentTrip,
      moveStop: state.moveStop,
      busy: state.tripSaveStatus === "saving",
    })),
  );
  const visitsByStop = useMemo(
    () => new Map(trip?.visits.map((visit) => [visit.stopId, visit])),
    [trip?.visits],
  );
  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled || busy) return;
    const { source, target } = event.operation;
    if (!source || !isSortable(source)) return;
    const from = source.initialIndex;
    const targetDate = target?.data?.targetDate;
    if (typeof targetDate === "string") moveStop(from, from, targetDate);
    else if (from !== source.index) moveStop(from, source.index);
  };
  return { trip, busy, visitsByStop, handleDragEnd };
}

export function useTripStopSortable(stop: TripStopDraft, index: number) {
  const { busy, visit, savedVisit } = useTripStore(
    useShallow((state) => ({
      busy: state.tripSaveStatus === "saving",
      visit: state.currentTrip?.visits.find((v) => v.stopId === stopId(stop)),
      savedVisit: serverTrip(state.trips, state.currentTrip)?.visits.find(
        (v) => v.stopId === stop.publicId,
      ),
    })),
  );
  const disabled = busy || !!visit?.locked;
  const sortable = useSortable({
    id: stop.clientId,
    index,
    disabled: { draggable: disabled, droppable: busy },
  });
  const changed =
    !!visit &&
    !!savedVisit &&
    (visit.date !== savedVisit.date ||
      visit.startMinute !== savedVisit.startMinute ||
      visit.endMinute !== savedVisit.endMinute);
  const unscheduled = !visit && !!savedVisit;
  return { ...sortable, disabled, visit, changed, unscheduled };
}
