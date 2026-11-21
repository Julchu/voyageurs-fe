import { useState } from "react";
import { Button } from "@base-ui/react/button";
import type { EventDropInfo, EventResizeDoneInfo } from "@fullcalendar/react";
import type { AvailabilityWindow } from "@/types/trip-api";
import { DAY, atMinute, dayOf } from "./calendar-time";
import {
  type Block,
  blockId,
  fromBlock,
  isValidBlock,
  toBlock,
  toBlocks,
  toWindows,
  weekdayRangeLabel,
} from "./open-hours";
import { OpenHoursPicker } from "./open-hours-picker";
import { calendarButton, calendarInput } from "./styles";
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

export function AvailabilityGrid({
  windows,
  disabled,
  onChange,
}: {
  windows: AvailabilityWindow[];
  disabled: boolean;
  onChange: (windows: AvailabilityWindow[]) => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const blocks = toBlocks(windows);
  const selected = blocks.find((block) => blockId(block) === selectedId);
  const without = (id: string) =>
    blocks.filter((block) => blockId(block) !== id);

  /** Replaces block `id` (or adds one when empty), then selects the merged result. */
  const apply = (id: string, next: Block) => {
    if (disabled || !isValidBlock(next)) return false;
    const merged = toWindows([...without(id), next]);
    onChange(merged);
    const block = toBlocks(merged).find(
      ({ start, end }) => start <= next.start && end >= next.end,
    );
    setSelectedId(block ? blockId(block) : "");
    return true;
  };
  const remove = () => {
    onChange(toWindows(without(selectedId)));
    setSelectedId("");
  };
  const moveBlock = ({
    event,
    revert,
  }: EventDropInfo | EventResizeDoneInfo) => {
    if (!event.start || !event.end) return revert();
    if (!apply(event.id, blockBetween(event.start, event.end))) revert();
  };

  return (
    <>
      <div className="flex flex-wrap items-end gap-2 border-b border-neutral-100 p-3 text-xs text-neutral-600">
        <label className="flex min-w-0 flex-col gap-1">
          Open hours
          <select
            className={calendarInput}
            disabled={disabled}
            value={selected ? selectedId : ""}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">New block</option>
            {blocks.map((block) => (
              <option key={blockId(block)} value={blockId(block)}>
                {weekdayRangeLabel(fromBlock(block))}
              </option>
            ))}
          </select>
        </label>
        <BlockForm
          key={selected ? selectedId : "new"}
          block={selected}
          disabled={disabled}
          onApply={(next) => apply(selected ? selectedId : "", next)}
          onRemove={selected && remove}
        />
      </div>
      <WeekCalendar
        initialDate={sunday}
        validRange={{ start: sunday, end: dayOf(atMinute(sunday, 7 * DAY)) }}
        dayHeaderFormat={{ weekday: "short" }}
        editable={!disabled}
        selectable={!disabled}
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
          contrastColor: "var(--color-emerald-900)",
          className:
            blockId(block) === selectedId ? selectedEventClass : undefined,
        }))}
        select={({ start, end, view }) => {
          apply("", blockBetween(start, end));
          view.calendar.unselect();
        }}
        eventClick={({ event }) => {
          if (!disabled) setSelectedId(event.id);
        }}
        eventDrop={moveBlock}
        eventResize={moveBlock}
      />
    </>
  );
}

const newBlockRange = {
  startDay: 0,
  startMinute: 540,
  endDay: 0,
  endMinute: 600,
};

function BlockForm({
  block,
  disabled,
  onApply,
  onRemove,
}: {
  block?: Block;
  disabled: boolean;
  onApply: (block: Block) => void;
  onRemove?: () => void;
}) {
  const [range, setRange] = useState(() =>
    block ? fromBlock(block) : newBlockRange,
  );
  const next = toBlock(range);
  const invalid = next.end <= next.start;
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid) onApply(next);
      }}
    >
      <div className="flex min-w-56 flex-col gap-1">
        Days and times
        <OpenHoursPicker
          value={range}
          disabled={disabled}
          invalid={invalid}
          onChange={setRange}
        />
      </div>
      <Button
        type="submit"
        disabled={disabled || invalid}
        className={calendarButton}
      >
        {block ? "Update open hours" : "Add open hours"}
      </Button>
      {onRemove && (
        <Button
          type="button"
          disabled={disabled}
          className={calendarButton}
          onClick={onRemove}
        >
          Remove block
        </Button>
      )}
    </form>
  );
}
