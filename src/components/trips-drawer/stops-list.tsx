import { useTripStore } from "@/providers/trip-store-provider";
import { useShallow } from "zustand/react/shallow";
import { DragEndEvent } from "@dnd-kit/dom";
import type { Coordinates } from "@/utils/interfaces";
import { isSortable } from "@dnd-kit/react/sortable";
import { DragDropProvider } from "@dnd-kit/react";
import { DraggableTripStops } from "@/components/trips-drawer/draggable-trip-stops";
import { useMapHook } from "@/hooks/use-map-hook";
import { MapNavigation } from "@/components/trips-drawer/types";

export const StopsList = ({ map }: MapNavigation) => {
  const { currentTrip, reorderStops } = useTripStore(
    useShallow(({ currentTrip, reorderStops }) => ({
      currentTrip,
      reorderStops,
    })),
  );

  const [{ flyTo }] = useMapHook({ map });

  const onClickHandler = (coordinates: Coordinates) => {
    flyTo({
      lat: coordinates.lat,
      lng: coordinates.lng,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) return;
    const { source } = event.operation;
    if (!source || !isSortable(source)) return;
    const from = source.initialIndex;
    const to = source.index;
    if (from === to) return;
    reorderStops(from, to);
  };

  if (!currentTrip)
    return (
      <p className="mt-4 text-sm text-neutral-500">No current trip yet.</p>
    );
  return (
    <div className="flex min-h-0 flex-auto flex-col">
      <div className={"shrink-0"}>
        {currentTrip.stops.length == 0 ? (
          <p className="text-sm text-neutral-500">
            Search an address or tap a place on the map, then add it to this
            trip.
          </p>
        ) : null}
      </div>

      <div
        className={
          "min-h-0 flex-auto touch-auto overflow-y-auto overscroll-contain"
        }
      >
        <DragDropProvider onDragEnd={handleDragEnd}>
          <ol className="flex flex-col gap-2 overflow-x-hidden">
            {currentTrip.stops.map((stop, index) => {
              const id = stop.clientId;

              return (
                <DraggableTripStops
                  id={id}
                  index={index}
                  key={id}
                  stop={stop}
                  onClickHandler={onClickHandler}
                />
              );
            })}
          </ol>
        </DragDropProvider>
      </div>
    </div>
  );
};