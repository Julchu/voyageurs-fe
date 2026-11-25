import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";
import { stopNumber } from "@/components/ui/button-styles";
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
  isLast: boolean;
  /** Set on the first stop of each day; unscheduled stops join the day above them. */
  dayHeading?: string;
};

export type StopActions = {
  open: (stop: TripStopDraft) => void;
  flyTo: (stop: TripStopDraft) => void;
  move: (from: number, to: number) => void;
  remove: (stop: TripStopDraft) => void;
};

const iconClass = "h-6 w-6 stroke-blue-500 group-data-highlighted:stroke-white";

const stopActionButton =
  "ml-auto flex size-9 cursor-pointer items-center justify-center rounded-full text-neutral-950 outline-none select-none hover:bg-blue-50 focus-visible:bg-blue-50 data-popup-open:bg-blue-50 any-pointer-coarse:opacity-100";

/** One stop in the drawer. Reordering and the actions menu only show while editing. */
export const TripStopItem = ({
  row,
  editing,
  busy,
  actions,
}: {
  row: StopRow;
  editing: boolean;
  busy: boolean;
  actions: StopActions;
}) => {
  const { stop, index, slot, changed } = row;
  const { ref, handleRef, isDragging, disabled } = useStopSortable(
    stop,
    index,
    { busy, locked: !editing || !!slot?.locked },
  );

  return (
    <li
      data-base-ui-swipe-ignore
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-1.5 py-2 transition-colors",
        isDragging
          ? "cursor-grab border-blue-300 bg-white shadow-xl"
          : "cursor-pointer border-transparent hover:bg-neutral-50",
      )}
    >
      {editing && (
        <StopDragHandle
          name={stop.name}
          handleRef={handleRef}
          disabled={disabled}
        />
      )}

      <button
        type="button"
        onClick={() => actions.open(stop)}
        className="flex min-w-0 flex-1 cursor-pointer flex-row items-center gap-3 text-left"
      >
        <span className={cn(stopNumber(!!slot), "size-8 text-sm")}>
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-wrap text-neutral-950">
            {stop.name}
          </span>
          {slot && (
            <span
              className={cn(
                "block text-sm font-semibold",
                changed ? "text-amber-600" : "text-blue-500",
              )}
            >
              {timeLabel(slot.startMinute)}–{timeLabel(slot.endMinute)}
            </span>
          )}
          <span className="block truncate text-sm text-wrap text-neutral-500 capitalize">
            {stop.streetAddress || "No address"}
          </span>
          <span className="hidden truncate text-xs text-neutral-400 capitalize sm:block">
            {stop.areaAddress || "No address"}
          </span>
        </span>
      </button>

      {changed && (
        <span className="text-[10px] text-amber-800">Time changed</span>
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
        {editing ? (
          <StopActionsMenu row={row} busy={busy} actions={actions} />
        ) : (
          <button
            type="button"
            aria-label={`Fly to ${stop.name}`}
            onClick={() => actions.flyTo(stop)}
            className={stopActionButton}
          >
            <FlyToIcon
              aria-hidden="true"
              className="h-6 w-6 fill-none stroke-blue-500"
            />
          </button>
        )}
      </div>
    </li>
  );
};

const StopActionsMenu = ({
  row: { stop, index, slot, isLast },
  busy,
  actions,
}: {
  row: StopRow;
  busy: boolean;
  actions: StopActions;
}) => {
  const locked = !!slot?.locked;

  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={busy}
        aria-label="Stop actions"
        className={stopActionButton}
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
