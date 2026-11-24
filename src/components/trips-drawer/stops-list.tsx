import { DragDropProvider } from "@dnd-kit/react";
import { Fragment } from "react";
import { flyTo } from "@/components/map-box/map-actions";
import { useMapStore } from "@/components/map-box/map-store";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
import {
  type StopActions,
  type StopRow,
  TripStopItem,
} from "@/components/trips-drawer/trip-stop-item";
import { useTripStopSorting } from "@/hooks/use-trip-stop-sorting";
import { useTripStore } from "@/providers/trip-store-provider";
import type { TimeSlot } from "@/types/trip-api";
import { dateDays } from "@/utils/trip-time";
import { stopId } from "@/utils/trip-stop";
import { serverTrip } from "@/utils/trip-sync";
import { TripDayHeading } from "./stop-drag-controls";

const slotMoved = (slot: TimeSlot, saved: TimeSlot) =>
  slot.date !== saved.date ||
  slot.startMinute !== saved.startMinute ||
  slot.endMinute !== saved.endMinute;

export const StopsList = () => {
  const map = useMapStore((state) => state.map);
  const { trip, busy, slotsByStop, handleDragEnd } = useTripStopSorting();
  const saved = useTripStore(({ trips, currentTrip }) =>
    serverTrip(trips, currentTrip),
  );
  const moveStop = useTripStore((state) => state.moveStop);
  const removeStop = useTripStore((state) => state.removeStop);

  const savedSlots = new Map(
    saved?.timeSlots.map((slot) => [slot.stopId, slot]),
  );
  const rows: StopRow[] = trip.stops.map((stop, index) => {
    const slot = slotsByStop.get(stopId(stop));
    const savedSlot = stop.publicId ? savedSlots.get(stop.publicId) : undefined;
    const previous = trip.stops[index - 1];
    return {
      stop,
      index,
      slot,
      changed: !!slot && !!savedSlot && slotMoved(slot, savedSlot),
      unscheduled: !slot && !!savedSlot,
      isLast: index === trip.stops.length - 1,
      startsDay:
        !previous || slot?.date !== slotsByStop.get(stopId(previous))?.date,
    };
  });
  const days =
    trip.startDate && trip.endDate
      ? dateDays(trip.startDate, trip.endDate)
      : [];

  const actions: StopActions = {
    open: (stop) => {
      openPlacePopup.openWithPayload(stop);
      flyTo(map, stop.coordinates);
    },
    flyTo: (stop) => flyTo(map, stop.coordinates),
    move: moveStop,
    remove: (stop) => removeStop(stopId(stop)),
  };

  return (
    <div className="flex min-h-0 flex-auto flex-col">
      {rows.length === 0 ? (
        <p className="shrink-0 text-sm text-neutral-500">
          Search an address or tap a place on the map, then add it to this trip.
        </p>
      ) : null}

      <div className="min-h-0 flex-auto touch-auto overflow-y-auto overscroll-none">
        <DragDropProvider onDragEnd={handleDragEnd}>
          <ol className="flex flex-col gap-2 overflow-x-hidden">
            {rows.map((row) => (
              <Fragment key={row.stop.clientId}>
                {row.startsDay ? (
                  <TripDayHeading date={row.slot?.date} disabled={busy} />
                ) : null}
                <TripStopItem
                  row={row}
                  days={days}
                  busy={busy}
                  actions={actions}
                />
              </Fragment>
            ))}
          </ol>
        </DragDropProvider>
      </div>
    </div>
  );
};
