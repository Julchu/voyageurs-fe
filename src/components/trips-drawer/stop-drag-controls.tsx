"use client";

import { type ComponentProps, useId, useLayoutEffect, useState } from "react";
import { cn } from "cn";
import { Button } from "@base-ui/react/button";
import { DragDropManager, type Draggable } from "@dnd-kit/dom";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { sectionLabel } from "@/components/ui/button-styles";
import { GripIcon } from "@/components/ui/icons/stop-card-icons";
import { useTripStore } from "@/providers/trip-store-provider";
import { canMoveStop } from "@/stores/trip-edits";
import { stopCountLabel } from "@/utils/trip-stop";
import { parseDate, weekdays } from "@/utils/trip-time";

/** DragDropProvider that ends a live drag before dnd-kit tears down its manager. */
export function StopDragProvider({
  plugins,
  onDragStart,
  ...props
}: ComponentProps<typeof DragDropProvider>) {
  const [manager] = useState(() => new DragDropManager({ plugins }));
  // dnd-kit destroys the manager in useInsertionEffect, where the re-renders a live drag triggers are not allowed.
  // This parent layout cleanup runs first. Skip idle: StrictMode also runs it on mount.
  useLayoutEffect(
    () => () => {
      if (!manager.dragOperation.status.idle) manager.destroy();
    },
    [manager],
  );
  return (
    <DragDropProvider
      {...props}
      manager={manager}
      onDragStart={(event, manager) => {
        navigator.vibrate?.(10); // no-op on iOS
        onDragStart?.(event, manager);
      }}
    />
  );
}

export function StopDragHandle({
  name,
  handleRef,
  disabled,
}: {
  name: string;
  handleRef: (element: Element | null) => void;
  disabled: boolean;
}) {
  return (
    <Button
      ref={handleRef}
      disabled={disabled}
      aria-label={`Reorder ${name}`}
      className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-neutral-400 outline-blue-500 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
    >
      <GripIcon aria-hidden="true" className="size-5 fill-neutral-400" />
    </Button>
  );
}

export function TripDayHeading({
  date,
  count,
  disabled,
  as = "li",
}: {
  date: string;
  /** Stops on this day. */
  count: number;
  disabled: boolean;
  as?: "li" | "div" | "tr";
}) {
  const trip = useTripStore(({ currentTrip }) => currentTrip);
  const { ref, isDropTarget } = useDroppable({
    id: useId(),
    data: { targetDate: date },
    disabled,
    // A heading that would reject this day move can't become the drop target.
    // `accept` is typed with the abstract Draggable; at runtime it's the DOM one.
    accept: (draggable) => {
      const source = draggable as Draggable;
      return (
        isSortable(source) &&
        canMoveStop(trip, source.initialIndex, source.initialIndex, date)
      );
    },
  });
  const day = parseDate(date);
  const heading = (
    <h3 className="flex items-center gap-2">
      <span className={sectionLabel}>
        {weekdays[day.getUTCDay()].slice(0, 3)} {day.getUTCDate()}
      </span>
      <span className="text-xs text-neutral-400">
        · {stopCountLabel(count)}
      </span>
      {isDropTarget && (
        <span className="ml-auto text-xs font-semibold text-blue-500">
          Drop here to append
        </span>
      )}
    </h3>
  );
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={cn(
        "rounded-2xl px-2 pt-4 pb-1 first:pt-1",
        isDropTarget && "bg-blue-50 outline-2 outline-blue-300 outline-dashed",
      )}
    >
      {as === "tr" ? (
        <td colSpan={8} className="border-b border-neutral-100 px-4 py-3">
          {heading}
        </td>
      ) : (
        heading
      )}
    </Tag>
  );
}
