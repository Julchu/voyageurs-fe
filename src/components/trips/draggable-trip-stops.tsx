import { useSortable } from "@dnd-kit/react/sortable";
import { TripStopFormData } from "@/utils/interfaces";
import { useTripStore } from "@/providers/trip-store-provider";
import { useShallow } from "zustand/react/shallow";

export const DraggableTripStops = ({
  id,
  index,
  stop,
}: {
  id: string;
  index: number;
  stop: TripStopFormData;
}) => {
  const { currentTrip, removeStop, reorderStops } = useTripStore(
    useShallow(({ currentTrip, removeStop, reorderStops }) => ({
      currentTrip,
      removeStop,
      reorderStops,
    })),
  );

  const { ref } = useSortable({
    id,
    index,
  });

  // return <li ref={ref}>{id}</li>;

  return (
    <li
      ref={ref}
      className={`flex cursor-grab items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-2`}
    >
      {/* drag handle — spread dragHandleProps HERE, not on the li */}
      <span
        className="cursor-grab px-1 text-neutral-400 select-none"
        aria-label={`Reorder ${stop.name}`}
      >
        ⠿
      </span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{stop.name}</span>
        <span className="block truncate text-xs text-neutral-500">
          {stop.address || "No address"}
        </span>
      </span>
      <button
        type="button"
        className="text-xs text-neutral-500"
        aria-label={`Move ${stop.name} up`}
        disabled={index === 0}
        onClick={() => {
          reorderStops(index - 1, index);
        }}
      >
        Up
      </button>
      <button
        type="button"
        className="text-xs text-neutral-500"
        aria-label={`Move ${stop.name} down`}
        // disabled={index === currentTrip.stops.length - 1}
        onClick={() => {
          reorderStops(index, index + 1);
        }}
      >
        Down
      </button>
      <button
        type="button"
        className="text-xs text-red-600"
        onClick={() => removeStop(stop.publicId || stop.clientId)}
      >
        Remove
      </button>
    </li>
  );
};

{
  /*<DragOverlay>*/
}
{
  /*  <div>I will be rendered while dragging...</div>*/
}
{
  /*</DragOverlay>*/
}