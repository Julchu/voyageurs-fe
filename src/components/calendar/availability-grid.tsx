import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { Popover } from "@base-ui/react/popover";
import { useMediaQuery } from "@base-ui/react/unstable-use-media-query";
import type { EventDropInfo, EventResizeDoneInfo } from "@fullcalendar/react";
import { dangerButton, primaryButton } from "@/components/ui/button-styles";
import { XIcon } from "@/components/ui/icons/close-icons";
import { TrashIcon } from "@/components/ui/icons/planner-icons";
import type { AvailabilityWindow } from "@/types/trip-api";
import {
  DAY_MINUTES as DAY,
  atMinute,
  dayOf,
  weekdays,
} from "@/utils/trip-time";
import {
  type Block,
  blockId,
  fromBlock,
  isValidBlock,
  toBlock,
  toBlocks,
  toWindows,
} from "./open-hours";
import { TimeRangeSelects } from "./range-popover";
import { WeekCalendar } from "./week-calendar";
import { selectedEventClass } from "./week-calendar-theme";

// Any fixed week works: the grid only shows weekdays, never dates.
const sunday = "2024-01-07";
const weekStart = atMinute(sunday, 0).getTime();
const weekMinute = (date: Date) => (date.getTime() - weekStart) / 60_000;
const blockBetween = (start: Date, end: Date): Block => ({
  start: weekMinute(start),
  end: weekMinute(end),
});

/** Where the block editor popover points: the clicked block, or the pointer after drawing one. */
type Anchor = Element | { getBoundingClientRect: () => DOMRect } | null;
type Editing = { id: string; anchor: Anchor };

const pointAt = (e: MouseEvent | null | undefined): Anchor =>
  e
    ? { getBoundingClientRect: () => new DOMRect(e.clientX, e.clientY, 0, 0) }
    : null;

export function AvailabilityGrid({
  windows,
  disabled,
  onChange,
}: {
  windows: AvailabilityWindow[];
  disabled: boolean;
  onChange: (windows: AvailabilityWindow[]) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)", {
    defaultMatches: false,
  });
  const [editing, setEditing] = useState<Editing | null>(null);
  const blocks = toBlocks(windows);
  const selected = blocks.find((block) => blockId(block) === editing?.id);
  const without = (id: string) =>
    blocks.filter((block) => blockId(block) !== id);

  /** Replaces block `id` (or adds one when empty). Returns the merged block's id. */
  const apply = (id: string, next: Block) => {
    if (disabled || !isValidBlock(next)) return null;
    const merged = toWindows([...without(id), next]);
    onChange(merged);
    const block = toBlocks(merged).find(
      ({ start, end }) => start <= next.start && end >= next.end,
    );
    return block ? blockId(block) : null;
  };
  const moveBlock = ({
    event,
    revert,
  }: EventDropInfo | EventResizeDoneInfo) => {
    setEditing(null);
    if (!event.start || !event.end) return revert();
    if (!apply(event.id, blockBetween(event.start, event.end))) revert();
  };

  const editor = selected && editing && (
    <BlockEditor
      key={editing.id}
      block={selected}
      disabled={disabled}
      onApply={(next) => {
        apply(editing.id, next);
        setEditing(null);
      }}
      onRemove={() => {
        onChange(toWindows(without(editing.id)));
        setEditing(null);
      }}
      onClose={() => setEditing(null)}
    />
  );

  return (
    <>
      <WeekCalendar
        initialDate={sunday}
        validRange={{ start: sunday, end: dayOf(atMinute(sunday, 7 * DAY)) }}
        dayHeaderFormat={{ weekday: isDesktop ? "short" : "narrow" }}
        // Phone columns are too narrow for the block's time and title.
        eventContent={isDesktop ? undefined : () => <></>}
        editable={!disabled}
        selectable={!disabled}
        highlightClass="rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50"
        selectAllow={({ start, end }) => isValidBlock(blockBetween(start, end))}
        eventAllow={({ start, end }) =>
          !disabled && isValidBlock(blockBetween(start, end))
        }
        events={blocks.map((block) => ({
          id: blockId(block),
          title: "Open",
          start: atMinute(sunday, block.start),
          end: atMinute(sunday, block.end),
          color: "var(--color-emerald-500)",
          contrastColor: "var(--color-emerald-950)",
          className:
            blockId(block) === editing?.id ? selectedEventClass : undefined,
        }))}
        select={({ start, end, view, jsEvent }) => {
          const id = apply("", blockBetween(start, end));
          if (id) setEditing({ id, anchor: pointAt(jsEvent) });
          view.calendar.unselect();
        }}
        eventClick={({ event, el }) => {
          if (!disabled) setEditing({ id: event.id, anchor: el });
        }}
        eventDrop={moveBlock}
        eventResize={moveBlock}
      />
      {isDesktop ? (
        <Popover.Root
          open={!!editor}
          onOpenChange={(open) => !open && setEditing(null)}
        >
          <Popover.Portal>
            <Popover.Positioner
              anchor={editing?.anchor}
              side="right"
              sideOffset={12}
              className="z-50"
            >
              <Popover.Popup
                aria-label="Open hours block"
                className="w-80 rounded-3xl border border-neutral-100 bg-white p-5 text-neutral-900 shadow-xl outline-none"
              >
                {editor}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ) : (
        editor && (
          <div className="shrink-0 border-t border-neutral-100 p-3">
            <div className="rounded-3xl border border-neutral-200 p-4 shadow-sm">
              {editor}
            </div>
          </div>
        )
      )}
    </>
  );
}

/** Edit one block's start and end time. Days change by dragging the block. */
function BlockEditor({
  block,
  disabled,
  onApply,
  onRemove,
  onClose,
}: {
  block: Block;
  disabled: boolean;
  onApply: (block: Block) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [range, setRange] = useState(() => fromBlock(block));
  const next = toBlock(range);
  const invalid = next.end <= next.start;
  const title =
    range.startDay === range.endDay
      ? weekdays[range.startDay]
      : `${weekdays[range.startDay]} – ${weekdays[range.endDay]}`;
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid) onApply(next);
      }}
    >
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="size-3.5 rounded bg-emerald-500" />
        <h3 className="text-lg font-bold">{title}</h3>
        <Button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="ml-auto flex size-8 cursor-pointer items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
        >
          <XIcon aria-hidden="true" className="size-5 stroke-current" />
        </Button>
      </div>
      <TimeRangeSelects
        start={range.startMinute}
        end={range.endMinute}
        disabled={disabled}
        invalid={invalid}
        onChange={(startMinute, endMinute) =>
          setRange({ ...range, startMinute, endMinute })
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          disabled={disabled}
          className={dangerButton}
          onClick={onRemove}
        >
          <TrashIcon aria-hidden="true" className="size-4" />
          Remove
        </Button>
        <Button
          type="submit"
          disabled={disabled || invalid}
          className={primaryButton}
        >
          Done
        </Button>
      </div>
    </form>
  );
}
