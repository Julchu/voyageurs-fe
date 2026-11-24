import { useShallow } from "zustand/react/shallow";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/dom";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { useTripStore } from "@/providers/trip-store-provider";
import { canMoveStop } from "@/stores/trip-edits";
import type { TripStopDraft } from "@/types/trip-draft";

/** Drag-to-reorder for the drawer and calendar lists. Both move stops in the same draft. */
export function useTripStopSorting() {
  const { trip, moveStop, busy } = useTripStore(
    useShallow((state) => ({
      trip: state.currentTrip,
      moveStop: state.moveStop,
      busy: state.save.status === "saving",
    })),
  );
  const slotsByStop = new Map(
    trip.timeSlots.map((slot) => [slot.stopId, slot]),
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
  // dnd-kit only reverts its live reorder on cancel, so block invalid spots before they open.
  const handleDragOver = (event: DragOverEvent) => {
    const { source, target } = event.operation;
    if (!isSortable(source) || !isSortable(target) || source.id === target.id)
      return;
    if (!canMoveStop(trip, source.initialIndex, target.index))
      event.preventDefault();
  };
  return { trip, busy, slotsByStop, handleDragEnd, handleDragOver };
}

/** One sortable stop. Nothing moves while saving; a reserved stop stays put but still takes drops. */
export function useStopSortable(
  stop: TripStopDraft,
  index: number,
  { busy, locked }: { busy: boolean; locked: boolean },
) {
  const disabled = busy || locked;
  const sortable = useSortable({
    id: stop.clientId,
    index,
    disabled: { draggable: disabled, droppable: busy },
  });
  return { ...sortable, disabled };
}
