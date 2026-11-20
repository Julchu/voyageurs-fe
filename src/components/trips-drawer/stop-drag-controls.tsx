"use client";

import { useId } from "react";
import { Button } from "@base-ui/react/button";
import { useDroppable } from "@dnd-kit/react";
import { GripIcon } from "@/components/ui/icons/stop-card-icons";

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
  const { ref, isDropTarget } = useDroppable({
    id: useId(),
    data: { targetDate: date },
    disabled: disabled || !date,
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
