import { DragDropProvider } from "@dnd-kit/react";
import { useShallow } from "zustand/react/shallow";
import { useMapHook } from "@/hooks/use-map-hook";
import { useTripStore } from "@/providers/trip-store-provider";
import type { MapNavigation } from "./types";
import { onSortEnd } from "./sortable";
import { TripStopItem } from "./trip-stop-item";

export const StopsList = ({ map }: MapNavigation) => {
  const { stops, moveStop, removeStop } = useTripStore(
    useShallow(({ currentTrip, moveStop, removeStop }) => ({
      stops: currentTrip.stops,
      moveStop,
      removeStop,
    })),
  );
  const { flyTo } = useMapHook({ map });

  if (!stops.length)
    return (
      <p className="text-sm text-neutral-500">
        Search an address or tap a place on the map, then add it to this trip.
      </p>
    );

  return (
    <div className="min-h-0 flex-auto touch-auto overflow-y-auto overscroll-none">
      <DragDropProvider onDragEnd={onSortEnd(moveStop)}>
        <ol className="flex flex-col gap-2 overflow-x-hidden">
          {stops.map((stop, index) => (
            <TripStopItem
              key={stop.clientId}
              stop={stop}
              index={index}
              isLast={index === stops.length - 1}
              onMove={moveStop}
              onRemove={removeStop}
              onFlyTo={flyTo}
            />
          ))}
        </ol>
      </DragDropProvider>
    </div>
  );
};
