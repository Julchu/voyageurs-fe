import { useTripStopSorting } from "@/hooks/use-trip-stop-sorting";
import { TripDayHeading } from "./stop-drag-controls";
import { DragDropProvider } from "@dnd-kit/react";
import { DraggableTripStops } from "@/components/trips-drawer/draggable-trip-stops";
import { useMapHook } from "@/hooks/use-map-hook";
import { MapNavigation } from "@/components/trips-drawer/types";
import { stopId } from "@/utils/trip-stop";
import { Fragment } from "react";

export const StopsList = ({ map }: MapNavigation) => {
  const { trip, busy, visitsByStop, handleDragEnd } = useTripStopSorting();
  const { flyTo } = useMapHook({ map });

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
              const visit = visitsByStop.get(stopId(stop));
              const previous = trip.stops[index - 1];
              const previousDay =
                previous && visitsByStop.get(stopId(previous))?.date;

              return (
                <Fragment key={stop.clientId}>
                  {index === 0 || visit?.date !== previousDay ? (
                    <TripDayHeading date={visit?.date} disabled={busy} />
                  ) : null}
                  <DraggableTripStops
                    index={index}
                    stop={stop}
                    onClickHandler={flyTo}
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
