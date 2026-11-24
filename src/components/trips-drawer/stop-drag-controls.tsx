"use client";

import { type ComponentProps, useId, useLayoutEffect, useState } from "react";
import { Button } from "@base-ui/react/button";
import { DragDropManager, type Draggable } from "@dnd-kit/dom";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { GripIcon } from "@/components/ui/icons/stop-card-icons";
import { useTripStore } from "@/providers/trip-store-provider";
import { canMoveStop } from "@/stores/trip-edits";

/** DragDropProvider that ends a live drag before dnd-kit tears down its manager. */
export function StopDragProvider({
  plugins,
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
  return <DragDropProvider {...props} manager={manager} />;
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
      className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-neutral-400 outline-blue-500 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
    >
      <GripIcon aria-hidden="true" className="size-6 fill-blue-500" />
    </Button>
  );
}

export function TripDayHeading({
  date,
  disabled,
  as = "li",
}: {
  date?: string;
  disabled: boolean;
  as?: "li" | "div" | "tr";
}) {
  const trip = useTripStore(({ currentTrip }) => currentTrip);
  const { ref, isDropTarget } = useDroppable({
    id: useId(),
    data: { targetDate: date },
    disabled: disabled || !date,
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
  const label = date
    ? new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}T00:00:00Z`))
    : "Unscheduled";
  const heading = (
    <h3 className="text-xs font-semibold tracking-wide text-neutral-500">
      {label}
      {date && !disabled && (
        <span className="ml-2 text-[10px] font-normal">
          Drop here to append
        </span>
      )}
    </h3>
  );
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={`rounded pt-3 pb-1 first:pt-0 ${isDropTarget ? "bg-blue-100 ring-1 ring-blue-300" : ""}`}
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
