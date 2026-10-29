import { useSortable } from "@dnd-kit/react/sortable";
import { Coordinates, TripStopFormData } from "@/utils/interfaces";
import { MoveDownArrow, MoveUpArrow } from "@/components/ui/icons/move-icons";
import { PinRemoveIcon } from "@/components/ui/icons/pin-icons";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
import { cn } from "cn";
import { Menu } from "@base-ui/react/menu";
import { useTripStore } from "@/providers/trip-store-provider";
import { useShallow } from "zustand/react/shallow";
import {
  GripIcon,
  VerticalEllipsisIcon,
} from "@/components/ui/icons/stop-card-icons";

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
  const { ref, isDragging } = useSortable({
    id,
    index,
  });

  return (
    <li
      data-base-ui-swipe-ignore
      ref={ref}
      className={cn(
        `flex ${isDragging ? "cursor-grab" : "cursor-pointer"} items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2`,
      )}
    >
      <span
        className="cursor-grab px-1 text-neutral-400 select-none"
        aria-label={`Reorder ${stop.name}`}
      >
        <GripIcon className={"h-6 w-6 fill-blue-500"} />
      </span>

      <div
        className={"flex flex-row items-center gap-2"}
        onClick={() => {
          openPlacePopup.openWithPayload(stop);
          // if (
          //   stop.mapboxId?.startsWith("google:") &&
          //   stop.name !== "Saved place"
          // )
          onClickHandler(stop.coordinates);
        }}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-wrap">{stop.name}</span>
        </span>
      </div>

      <div className={"ml-auto shrink-0"}>
        <PlaceActionsMenu index={index} stop={stop} />
      </div>
    </li>
  );
};

export const PlaceActionsMenu = ({
  stop,
  index,
}: {
  stop: TripStopFormData;
  index: number;
}) => {
  const { currentTrip, removeStop, reorderStops } = useTripStore(
    useShallow(({ currentTrip, removeStop, reorderStops }) => ({
      currentTrip,
      removeStop,
      reorderStops,
    })),
  );

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Stop actions"
        className="ml-auto flex size-8 cursor-pointer items-center justify-center text-neutral-950 outline-none select-none any-pointer-coarse:opacity-100"
      >
        <VerticalEllipsisIcon className={"h-6 w-6 fill-blue-500"} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="end"
          sideOffset={8}
          className={"z-50 outline-hidden"}
        >
          <Menu.Popup
            className={
              "flex origin-[var(--transform-origin)] flex-col border border-gray-200 p-2 text-black shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] outline-hidden transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-100 data-starting-style:scale-[0.98] data-starting-style:opacity-0"
            }
          >
            {index !== 0 ? (
              <MenuItem
                aria-label={`Move ${stop.name} up`}
                onClick={() => {
                  reorderStops(index - 1, index);
                }}
              >
                <MoveUpArrow
                  className={
                    "h-6 w-6 cursor-pointer stroke-blue-500 group-hover:stroke-white"
                  }
                />
                Move Up
              </MenuItem>
            ) : null}

            {!(currentTrip && index === currentTrip.stops.length - 1) ? (
              <MenuItem
                aria-label={`Move ${stop.name} down`}
                onClick={() => {
                  reorderStops(index, index + 1);
                }}
              >
                <MoveDownArrow
                  className={
                    "h-6 w-6 cursor-pointer stroke-blue-500 group-hover:stroke-white"
                  }
                />
                Move Down
              </MenuItem>
            ) : null}

            <MenuItem
              onClick={() => removeStop(stop.publicId || stop.clientId)}
            >
              <PinRemoveIcon
                className={
                  "h-6 w-6 fill-none stroke-red-500 group-hover:stroke-white"
                }
              />
              Remove
            </MenuItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

const MenuItem = (props: Menu.Item.Props) => (
  <Menu.Item
    className={
      "group flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm leading-4 text-black outline-hidden select-none hover:bg-blue-500 hover:text-white data-disabled:text-neutral-500 data-highlighted:relative"
    }
    {...props}
  />
);