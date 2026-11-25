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
import type { TripStopDraft } from "@/types/trip-draft";
import { stopId } from "@/utils/trip-stop";
import { serverTrip } from "@/utils/trip-sync";
import { StopDragProvider, TripDayHeading } from "./stop-drag-controls";

const slotMoved = (slot: TimeSlot, saved: TimeSlot) =>
  slot.date !== saved.date ||
  slot.startMinute !== saved.startMinute ||
  slot.endMinute !== saved.endMinute;

/** Each stop's day: its own slot's date, or the day of the scheduled stop above it. */
const stopDays = (stops: TripStopDraft[], slotsByStop: Map<string, TimeSlot>) =>
  stops.reduce<(string | undefined)[]>(
    (days, stop) => [
      ...days,
      slotsByStop.get(stopId(stop))?.date ?? days.at(-1),
    ],
    [],
  );

export const StopsList = ({ editing }: { editing: boolean }) => {
  const map = useMapStore((state) => state.map);
  const { trip, busy, slotsByStop, handleDragEnd, handleDragOver } =
    useTripStopSorting();
  const saved = useTripStore(({ trips, currentTrip }) =>
    serverTrip(trips, currentTrip),
  );
  const moveStop = useTripStore((state) => state.moveStop);
  const removeStop = useTripStore((state) => state.removeStop);

  const savedSlots = new Map(
    saved?.timeSlots.map((slot) => [slot.stopId, slot]),
  );
  const days = stopDays(trip.stops, slotsByStop);
  const dayCount = (day: string) => days.filter((item) => item === day).length;
  const rows: StopRow[] = trip.stops.map((stop, index) => {
    const slot = slotsByStop.get(stopId(stop));
    const savedSlot = stop.publicId ? savedSlots.get(stop.publicId) : undefined;
    return {
      stop,
      index,
      slot,
      changed: !!slot && !!savedSlot && slotMoved(slot, savedSlot),
      isLast: index === trip.stops.length - 1,
      dayHeading: days[index] !== days[index - 1] ? days[index] : undefined,
    };
  });

  const actions: StopActions = {
    open: (stop) => openPlacePopup.openWithPayload(stop),
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
        <StopDragProvider onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
          <ol className="flex flex-col gap-1 overflow-x-hidden">
            {rows.map((row) => (
              <Fragment key={row.stop.clientId}>
                {row.dayHeading ? (
                  <TripDayHeading
                    date={row.dayHeading}
                    count={dayCount(row.dayHeading)}
                    disabled={busy}
                  />
                ) : null}
                <TripStopItem
                  row={row}
                  editing={editing}
                  busy={busy}
                  actions={actions}
                />
              </Fragment>
            ))}
          </ol>
        </StopDragProvider>
      </div>
    </div>
  );
};
