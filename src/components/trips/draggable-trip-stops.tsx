import { useSortable } from "@dnd-kit/react/sortable";
import { Coordinates, TripStopFormData } from "@/utils/interfaces";
import { useTripStore } from "@/providers/trip-store-provider";
import { useShallow } from "zustand/react/shallow";
import { MoveDownArrow, MoveUpArrow } from "@/components/ui/icons/move-icons";
import { PinRemoveIcon } from "@/components/ui/icons/map-pins";
import { Button } from "@base-ui/react";

export const DraggableTripStops = ({
  id,
  index,
  stop,
  onClickHandler,
}: {
  id: string;
  index: number;
  stop: TripStopFormData;
  onClickHandler: (coords: Coordinates, zoom?: number) => void;
}) => {
  const { currentTrip, removeStop, reorderStops } = useTripStore(
    useShallow(({ currentTrip, removeStop, reorderStops }) => ({
      currentTrip,
      removeStop,
      reorderStops,
    })),
  );

  const { ref, isDragging } = useSortable({
    id,
    index,
  });

  return (
    <li
      data-base-ui-swipe-ignore
      ref={ref}
      onClick={() => onClickHandler(stop.coordinates)}
      className={`flex ${isDragging ? "cursor-grab" : "cursor-pointer"} items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-2`}
    >
      <span
        className="cursor-grab px-1 text-neutral-400 select-none"
        aria-label={`Reorder ${stop.name}`}
      >
        ⠿
      </span>
      <div className={"flex flex-row items-center gap-2"}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{stop.name}</span>
          <span className="block truncate text-xs text-neutral-500">
            {stop.streetAddress || "No address"}
          </span>
          <span className="block truncate text-xs text-neutral-500">
            {stop.areaAddress || "No address"}
          </span>
          <span className="block truncate text-xs text-neutral-500">
            {stop.category || "No category"}
          </span>
        </span>

        {/* TODO: context menu */}
        <button
          type="button"
          className="text-xs text-neutral-500"
          aria-label={`Move ${stop.name} up`}
          disabled={index === 0}
          onClick={() => {
            reorderStops(index - 1, index);
          }}
        >
          <MoveUpArrow className={"h-6 w-6 cursor-pointer stroke-blue-500"} />
        </button>
        <button
          type="button"
          className="text-xs text-neutral-500"
          aria-label={`Move ${stop.name} down`}
          disabled={
            currentTrip ? index === currentTrip.stops.length - 1 : false
          }
          onClick={() => {
            reorderStops(index, index + 1);
          }}
        >
          <MoveDownArrow className={"h-6 w-6 cursor-pointer stroke-blue-500"} />
        </button>
        <Button
          type="button"
          onClick={() => removeStop(stop.publicId || stop.clientId)}
        >
          <PinRemoveIcon className={"h-5 w-5 text-red-500"} />
        </Button>
      </div>
    </li>
  );
};