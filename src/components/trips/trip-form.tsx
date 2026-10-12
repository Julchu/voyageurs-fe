import { useTripStore } from "@/providers/trip-store-provider";
import { useShallow } from "zustand/react/shallow";
import { Separator } from "@base-ui/react";
import { CircleResetIcon } from "@/components/ui/icons/circle-reset-icon";
import { MapSaveIcon } from "@/components/ui/icons/map-form-icons";
import { Cursor, DragEndEvent } from "@dnd-kit/dom";
import { useMapHook } from "@/hooks/use-map-hook";
import { RefObject } from "react";
import type { Map } from "mapbox-gl";
import { TripSelector } from "@/components/trips/trip-selector";
import { isSortable } from "@dnd-kit/react/sortable";
import { DragDropProvider } from "@dnd-kit/react";
import { DraggableTripStops } from "@/components/trips/draggable-trip-stops";

export const TripForm = ({ map }: { map: RefObject<Map | null> }) => {
  const { currentTrip, resetDraft } = useTripStore(
    useShallow(({ currentTrip, resetDraft }) => ({
      currentTrip,
      resetDraft,
    })),
  );

  // TODO:
  const onSaveHandler = () => {
    return;
  };

  // TODO: set draft
  const onResetHandler = () => {
    return resetDraft();
  };

  return (
    <div className={"flex min-h-0 flex-1 flex-col font-medium"}>
      {/*{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}*/}

      {currentTrip ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={"px-4"}>
            {/* TODO: autocomplete/combobox to search user's/store's trips */}

            <TripSelector />

            {currentTrip.stops.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Search an address or tap a place on the map, then add it to this
                trip.
              </p>
            ) : null}
          </div>

          {/* Trip list */}
          <div
            className={
              "min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain"
            }
          >
            <StopsList map={map} />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">No current trip yet.</p>
      )}

      <div className={"mt-auto shrink-0"}>
        <Separator orientation="horizontal" className="h-px bg-gray-200" />

        {/* Clear trip button */}
        <div className="flex justify-end gap-4 p-4">
          <button
            type="button"
            onClick={onResetHandler}
            className="group flex h-10 w-full cursor-pointer items-center justify-center gap-x-2 rounded-md border border-gray-200 px-4 font-medium tracking-widest hover:bg-red-500 hover:text-white lg:w-auto"
          >
            <CircleResetIcon className={"group-hover:fill-white"} />
            Restore
          </button>

          {/* Save trip button */}
          <button
            type="button"
            // onClick={handleSubmit(onSaveHandler)}
            className="group flex h-10 w-full cursor-pointer items-center justify-center gap-x-2 rounded-md border border-gray-200 bg-blue-500 px-4 font-medium tracking-widest text-white hover:bg-green-500 lg:w-auto"
          >
            <MapSaveIcon className={"fill-white"} />
            Save trip
          </button>
        </div>
      </div>
    </div>
  );
};

export const StopsList = ({ map }: { map: RefObject<Map | null> }) => {
  const { currentTrip, reorderStops } = useTripStore(
    useShallow(({ currentTrip, reorderStops }) => ({
      currentTrip,
      reorderStops,
    })),
  );

  const [{ flyTo }] = useMapHook({
    map,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) return;
    const { source } = event.operation;
    if (!source || !isSortable(source)) return;
    const from = source.initialIndex;
    const to = source.index;
    if (from === to) return;
    reorderStops(from, to);
  };
  return currentTrip ? (
    <DragDropProvider
      onDragEnd={handleDragEnd}
      plugins={(defaults) => [
        ...defaults,
        Cursor.configure({ cursor: "move" }),
      ]}
    >
      <ol className="flex flex-col gap-2 p-4">
        {currentTrip.stops.map((stop, index) => {
          const id = String(stop.clientId ?? stop.publicId ?? index);

          return (
            <DraggableTripStops
              id={id}
              index={index}
              key={id}
              stop={stop}
              onClickHandler={flyTo}
            />
          );
        })}
      </ol>
    </DragDropProvider>
  ) : null;
};