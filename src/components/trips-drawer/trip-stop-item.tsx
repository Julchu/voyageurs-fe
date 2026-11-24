import { Field } from "@base-ui/react/field";
import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";
import { FlyToIcon } from "@/components/ui/icons/map-icons";
import { MoveDownArrow, MoveUpArrow } from "@/components/ui/icons/move-icons";
import { PinRemoveIcon } from "@/components/ui/icons/pin-icons";
import { VerticalEllipsisIcon } from "@/components/ui/icons/stop-card-icons";
import { MenuItem } from "@/components/ui/menu-item";
import { popupMotion, popupSurface } from "@/components/ui/popup-styles";
import { useStopSortable } from "@/hooks/use-trip-stop-sorting";
import type { TimeSlot } from "@/types/trip-api";
import type { TripStopDraft } from "@/types/trip-draft";
import { timeLabel } from "@/utils/trip-time";
import { StopDragHandle } from "./stop-drag-controls";

export type StopRow = {
  stop: TripStopDraft;
  index: number;
  slot?: TimeSlot;
  changed: boolean;
  unscheduled: boolean;
  isLast: boolean;
  startsDay: boolean;
};

export type StopActions = {
  open: (stop: TripStopDraft) => void;
  flyTo: (stop: TripStopDraft) => void;
  move: (from: number, to: number, day?: string) => void;
  remove: (stop: TripStopDraft) => void;
};

const iconClass = "h-6 w-6 stroke-blue-500 group-data-highlighted:stroke-white";

export const TripStopItem = ({
  row,
  days,
  busy,
  actions,
}: {
  row: StopRow;
  days: string[];
  busy: boolean;
  actions: StopActions;
}) => {
  const { stop, index, slot, changed, unscheduled } = row;
  const { ref, handleRef, isDragging, disabled } = useStopSortable(
    stop,
    index,
    { busy, locked: !!slot?.locked },
  );

  return (
    <li
      data-base-ui-swipe-ignore
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-xl border p-2",
        isDragging && "cursor-grab",
        changed || unscheduled
          ? "border-amber-300 bg-amber-50"
          : "border-neutral-200 bg-white",
      )}
    >
      <StopDragHandle
        name={stop.name}
        handleRef={handleRef}
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => actions.open(stop)}
        className="flex cursor-pointer flex-row items-center gap-2 text-left"
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
          {slot ? (
            <span className="mt-1 block text-xs text-blue-700">
              {timeLabel(slot.startMinute)}–{timeLabel(slot.endMinute)}
            </span>
          ) : null}
        </span>
      </button>

      {(changed || unscheduled) && (
        <span className="text-[10px] text-amber-800">
          {unscheduled ? "Unscheduled" : "Time changed"}
        </span>
      )}
      {slot?.locked && (
        <span
          className="text-[10px] text-neutral-500"
          title="Remove the reservation on the calendar to rearrange"
        >
          Reserved
        </span>
      )}
      <div className="ml-auto shrink-0">
        <StopActionsMenu row={row} days={days} busy={busy} actions={actions} />
      </div>
    </li>
  );
};

const StopActionsMenu = ({
  row: { stop, index, slot, isLast },
  days,
  busy,
  actions,
}: {
  row: StopRow;
  days: string[];
  busy: boolean;
  actions: StopActions;
}) => {
  const locked = !!slot?.locked;

  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={busy}
        aria-label="Stop actions"
        className="ml-auto flex size-8 cursor-pointer items-center justify-center text-neutral-950 outline-none select-none any-pointer-coarse:opacity-100"
      >
        <VerticalEllipsisIcon className="h-6 w-6 fill-blue-500" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="end"
          sideOffset={8}
          className="z-50 outline-hidden"
        >
          <Menu.Popup
            className={cn(
              popupSurface,
              popupMotion,
              "flex flex-col rounded-2xl p-2",
            )}
          >
            <MenuItem onClick={() => actions.flyTo(stop)}>
              <FlyToIcon
                aria-hidden="true"
                className="h-6 w-6 fill-none stroke-blue-500 group-data-highlighted:stroke-white"
              />
              Fly to location
            </MenuItem>

            {index !== 0 && !locked ? (
              <MenuItem
                aria-label={`Move ${stop.name} up`}
                onClick={() => actions.move(index, index - 1)}
              >
                <MoveUpArrow className={iconClass} />
                Move Up
              </MenuItem>
            ) : null}

            {!isLast && !locked ? (
              <MenuItem
                aria-label={`Move ${stop.name} down`}
                onClick={() => actions.move(index, index + 1)}
              >
                <MoveDownArrow className={iconClass} />
                Move Down
              </MenuItem>
            ) : null}

            {slot && !locked && days.length > 1 && (
              <Field.Root className="flex items-center gap-2 px-2 py-2 text-xs">
                <Field.Label>Move {stop.name} to day</Field.Label>
                <Field.Control
                  render={<select />}
                  value={slot.date}
                  className="rounded border border-neutral-200 p-1"
                  onValueChange={(day) => actions.move(index, index, day)}
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </Field.Control>
              </Field.Root>
            )}

            <MenuItem onClick={() => actions.remove(stop)}>
              <PinRemoveIcon className="h-6 w-6 fill-none stroke-red-500 group-data-highlighted:stroke-white" />
              Remove
            </MenuItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
