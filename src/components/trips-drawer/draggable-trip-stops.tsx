import {
  useTripStopSorting,
  useTripStopSortable,
} from "@/hooks/use-trip-stop-sorting";
import { StopDragHandle } from "./stop-drag-controls";
import type { Coordinates } from "@/utils/interfaces";
import type { TripStopDraft } from "@/types/trip-draft";
import { MoveDownArrow, MoveUpArrow } from "@/components/ui/icons/move-icons";
import { PinRemoveIcon } from "@/components/ui/icons/pin-icons";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
import { Field } from "@base-ui/react/field";
import { Menu } from "@base-ui/react/menu";
import { useTripStore } from "@/providers/trip-store-provider";
import { useShallow } from "zustand/react/shallow";
import { VerticalEllipsisIcon } from "@/components/ui/icons/stop-card-icons";
import { FlyToIcon } from "@/components/ui/icons/map-icons";
import { dateDays, timeLabel } from "@/utils/trip-calendar";
import { stopId } from "@/utils/trip-stop";

export const DraggableTripStops = ({
  index,
  stop,
  onClickHandler,
}: {
  index: number;
  stop: TripStopDraft;
  onClickHandler: (coords: Coordinates, zoom?: number) => void;
}) => {
  const { ref, handleRef, isDragging, disabled, visit, changed, unscheduled } =
    useTripStopSortable(stop, index);

  return (
    <li
      data-base-ui-swipe-ignore
      ref={ref}
      className={`flex items-center gap-2 rounded-xl border p-2 ${isDragging ? "cursor-grab" : "cursor-pointer"} ${changed || unscheduled ? "border-amber-300 bg-amber-50" : "border-neutral-200 bg-white"}`}
    >
      <StopDragHandle
        name={stop.name}
        handleRef={handleRef}
        disabled={disabled}
      />

      <div
        className={"flex flex-row items-center gap-2"}
        onClick={() => {
          openPlacePopup.openWithPayload(stop);
          onClickHandler(stop.coordinates);
        }}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-wrap">{stop.name}</span>
          <span className="block truncate text-xs text-wrap text-neutral-500 capitalize">
            {stop.streetAddress || "No address"}
          </span>
          <span className="hidden truncate text-xs text-neutral-500 capitalize sm:block">
            {stop.areaAddress || "No address"}
          </span>
          {visit ? (
            <span className="mt-1 block text-xs text-blue-700">
              {timeLabel(visit.startMinute)}–{timeLabel(visit.endMinute)}
            </span>
          ) : null}
        </span>
      </div>

      {(changed || unscheduled) && (
        <span className="text-[10px] text-amber-800">
          {unscheduled ? "Unscheduled" : "Time changed"}
        </span>
      )}
      {visit?.locked && (
        <span
          className="text-[10px] text-neutral-500"
          title="Remove the reservation on the calendar to rearrange"
        >
          Reserved
        </span>
      )}
      <div className={"ml-auto shrink-0"}>
        <PlaceActionsMenu
          index={index}
          stop={stop}
          onJumpToLocation={() => onClickHandler(stop.coordinates)}
        />
      </div>
    </li>
  );
};

export const PlaceActionsMenu = ({
  stop,
  index,
  onJumpToLocation,
}: {
  stop: TripStopDraft;
  index: number;
  onJumpToLocation: () => void;
}) => {
  const { trip, busy, visitsByStop } = useTripStopSorting();
  const { removeStop, moveStop } = useTripStore(
    useShallow(({ removeStop, moveStop }) => ({ removeStop, moveStop })),
  );

  const visit = visitsByStop.get(stopId(stop));
  const days =
    trip?.startDate && trip.endDate
      ? dateDays(trip.startDate, trip.endDate)
      : [];
  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={busy}
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
              "flex origin-[var(--transform-origin)] flex-col rounded-2xl bg-white p-2 text-black shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] outline-hidden transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none"
            }
          >
            <MenuItem onClick={onJumpToLocation}>
              <FlyToIcon
                aria-hidden="true"
                className="h-6 w-6 fill-none stroke-blue-500 group-data-highlighted:stroke-white"
              />
              Fly to location
            </MenuItem>

            {index !== 0 && !visit?.locked ? (
              <MenuItem
                aria-label={`Move ${stop.name} up`}
                disabled={busy}
                onClick={() => moveStop(index, index - 1)}
              >
                <MoveUpArrow
                  className={
                    "h-6 w-6 cursor-pointer stroke-blue-500 group-data-highlighted:stroke-white"
                  }
                />
                Move Up
              </MenuItem>
            ) : null}

            {!(trip && index === trip.stops.length - 1) && !visit?.locked ? (
              <MenuItem
                aria-label={`Move ${stop.name} down`}
                disabled={busy}
                onClick={() => moveStop(index, index + 1)}
              >
                <MoveDownArrow
                  className={
                    "h-6 w-6 cursor-pointer stroke-blue-500 group-data-highlighted:stroke-white"
                  }
                />
                Move Down
              </MenuItem>
            ) : null}

            {visit && !visit.locked && days.length > 1 && (
              <Field.Root className="flex items-center gap-2 px-2 py-2 text-xs">
                <Field.Label>Move {stop.name} to day</Field.Label>
                <Field.Control
                  render={<select />}
                  value={visit.date}
                  disabled={busy}
                  className="rounded border border-neutral-200 p-1"
                  onValueChange={(day) => moveStop(index, index, day)}
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </Field.Control>
              </Field.Root>
            )}
            <MenuItem disabled={busy} onClick={() => removeStop(stopId(stop))}>
              <PinRemoveIcon
                className={
                  "h-6 w-6 fill-none stroke-red-500 group-data-highlighted:stroke-white"
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
      "group flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm leading-4 text-black outline-hidden transition-colors duration-150 select-none data-disabled:text-neutral-500 data-highlighted:bg-blue-500 data-highlighted:text-white motion-reduce:transition-none"
    }
    {...props}
  />
);
