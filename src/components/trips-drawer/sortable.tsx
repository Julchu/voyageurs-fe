"use client";

import type { DragEndEvent } from "@dnd-kit/dom";
import { isSortable } from "@dnd-kit/react/sortable";
import { Button } from "@base-ui/react/button";
import { GripIcon } from "@/components/ui/icons/stop-card-icons";

/** Calls `move` with the start and end index of a finished sortable drag. */
export const onSortEnd =
  (move: (from: number, to: number) => void) =>
  ({ canceled, operation: { source } }: DragEndEvent) => {
    if (canceled || !source || !isSortable(source)) return;
    if (source.initialIndex !== source.index)
      move(source.initialIndex, source.index);
  };

export const StopDragHandle = ({
  name,
  handleRef,
  disabled,
}: {
  name: string;
  handleRef: (element: Element | null) => void;
  disabled: boolean;
}) => (
  <Button
    ref={handleRef}
    disabled={disabled}
    aria-label={`Reorder ${name}`}
    className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-neutral-400 outline-blue-500 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
  >
    <GripIcon aria-hidden="true" className="size-6 fill-blue-500" />
  </Button>
);
