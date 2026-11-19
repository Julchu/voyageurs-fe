import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";
import { useTripStore } from "@/providers/trip-store-provider";
import { selectIsSaving } from "@/stores/trip-store";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
import { MenuItem, MenuPopup } from "@/components/ui/menu";
import { FlyToIcon } from "@/components/ui/icons/map-icons";
import { MoveDownArrow, MoveUpArrow } from "@/components/ui/icons/move-icons";
import { PinRemoveIcon } from "@/components/ui/icons/pin-icons";
import { VerticalEllipsisIcon } from "@/components/ui/icons/stop-card-icons";
import type { TripStopDraft } from "@/types/trip-draft";
import type { Coordinates } from "@/utils/interfaces";
import { draftId } from "@/utils/trip-draft";
import { StopDragHandle } from "./sortable";

export type StopListActions = {
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  onFlyTo: (coordinates: Coordinates) => void;
};

type Props = StopListActions & {
  stop: TripStopDraft;
  index: number;
  isLast: boolean;
  /** Pinned stops can't be dragged or moved up/down. */
  pinned?: boolean;
  className?: string;
  /** Extra lines under the address. */
  children?: ReactNode;
  /** Extra menu items above Remove. */
  actions?: ReactNode;
};

export const TripStopItem = ({
  stop,
  index,
  isLast,
  pinned = false,
  className,
  children,
  actions,
  onMove,
  onRemove,
  onFlyTo,
}: Props) => {
  const busy = useTripStore(selectIsSaving);
  const { ref, handleRef, isDragging } = useSortable({
    id: stop.clientId,
    index,
    disabled: { draggable: busy || pinned, droppable: busy },
  });
  const canMove = !busy && !pinned;

  return (
    <li
      data-base-ui-swipe-ignore
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2",
        isDragging && "cursor-grab",
        className,
      )}
    >
      <StopDragHandle
        name={stop.name}
        handleRef={handleRef}
        disabled={!canMove}
      />

      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        onClick={() => {
          openPlacePopup.openWithPayload(stop);
          onFlyTo(stop.coordinates);
        }}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm">{stop.name}</span>
          <span className="block text-xs text-neutral-500 capitalize">
            {stop.streetAddress || "No address"}
          </span>
          <span className="hidden text-xs text-neutral-500 capitalize sm:block">
            {stop.areaAddress || "No address"}
          </span>
          {children}
        </span>
      </button>

      <Menu.Root>
        <Menu.Trigger
          disabled={busy}
          aria-label={`Actions for ${stop.name}`}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center outline-none select-none"
        >
          <VerticalEllipsisIcon className="size-6 fill-blue-500" />
        </Menu.Trigger>
        <MenuPopup>
          <MenuItem onClick={() => onFlyTo(stop.coordinates)}>
            <FlyToIcon aria-hidden="true" className={iconClass} />
            Fly to location
          </MenuItem>
          {canMove && index > 0 && (
            <MenuItem onClick={() => onMove(index, index - 1)}>
              <MoveUpArrow aria-hidden="true" className={iconClass} />
              Move up
            </MenuItem>
          )}
          {canMove && !isLast && (
            <MenuItem onClick={() => onMove(index, index + 1)}>
              <MoveDownArrow aria-hidden="true" className={iconClass} />
              Move down
            </MenuItem>
          )}
          {actions}
          <MenuItem onClick={() => onRemove(draftId(stop))}>
            <PinRemoveIcon
              aria-hidden="true"
              className="size-6 fill-none stroke-red-500 group-data-highlighted:stroke-white"
            />
            Remove
          </MenuItem>
        </MenuPopup>
      </Menu.Root>
    </li>
  );
};

const iconClass =
  "size-6 fill-none stroke-blue-500 group-data-highlighted:stroke-white";
