import { useTripStopSorting } from "@/hooks/use-trip-stop-sorting";
import { TripDayHeading } from "./stop-drag-controls";
import { DragDropProvider } from "@dnd-kit/react";
import { DraggableTripStops } from "@/components/trips-drawer/draggable-trip-stops";
import { flyTo } from "@/components/map-box/map-actions";
import { useMapStore } from "@/components/map-box/map-store";
import { stopId } from "@/utils/trip-stop";
import { Fragment } from "react";

export const StopsList = () => {
  const map = useMapStore((state) => state.map);
  const { trip, busy, slotsByStop, handleDragEnd } = useTripStopSorting();

  if (!trip)
    return (
      <p className="mt-4 text-sm text-neutral-500">No current trip yet.</p>
    );

  return (
    <div className="flex min-h-0 flex-auto flex-col">
      <div className={"shrink-0"}>
        {trip.stops.length == 0 ? (
          <p className="text-sm text-neutral-500">
            Search an address or tap a place on the map, then add it to this
            trip.
          </p>
        ) : null}
      </div>

      <div
        className={
          "min-h-0 flex-auto touch-auto overflow-y-auto overscroll-none"
        }
      >
        <DragDropProvider onDragEnd={handleDragEnd}>
          <ol className="flex flex-col gap-2 overflow-x-hidden">
            {trip.stops.map((stop, index) => {
              const slot = slotsByStop.get(stopId(stop));
              const previous = trip.stops[index - 1];
              const previousDay =
                previous && slotsByStop.get(stopId(previous))?.date;

              return (
                <Fragment key={stop.clientId}>
                  {index === 0 || slot?.date !== previousDay ? (
                    <TripDayHeading date={slot?.date} disabled={busy} />
                  ) : null}
                  <DraggableTripStops
                    index={index}
                    stop={stop}
                    onClickHandler={(coordinates) => flyTo(map, coordinates)}
                  />
                </Fragment>
              );
            })}
          </ol>
        </DragDropProvider>
      </div>
    </div>
  );
};
