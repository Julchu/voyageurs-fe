import { useState } from "react";
import type { EventDropInfo, EventResizeDoneInfo } from "@fullcalendar/react";
import type { AvailabilityWindow } from "@/types/trip-api";
import { timeLabel } from "@/utils/trip-calendar";
import { atMinute, mergeHours, weekdays } from "./calendar-time";
import { WeekdayTimeRange, type WeekdayTimeRangeValue } from "./range-picker";
import { calendarButton, calendarInput } from "./styles";
import { WeekCalendar } from "./week-calendar";
import { selectedEventClass } from "./week-calendar-theme";

const sunday = "2024-01-07";
const weekStart = atMinute(sunday, 0).getTime();
const weekMinute = (date: Date) => (date.getTime() - weekStart) / 60_000;
type Block = { start: number; end: number };
const blockId = (block: Block) => `${block.start}:${block.end}`;
const endDay = (end: number) => Math.ceil(end / 1440) - 1;

function continuousBlocks(windows: AvailabilityWindow[]) {
  const blocks: Block[] = [];
  for (const w of mergeHours(windows)) {
    const start = w.day * 1440 + w.startMinute;
    const end = w.day * 1440 + w.endMinute;
    const last = blocks.at(-1);
    if (last && last.end === start) last.end = end;
    else blocks.push({ start, end });
  }
  return blocks;
}

function dailyWindows(blocks: Block[]) {
  return mergeHours(
    blocks.flatMap(({ start, end }) => {
      const windows: AvailabilityWindow[] = [];
      for (let cursor = start; cursor < end; ) {
        const day = Math.floor(cursor / 1440);
        const edge = Math.min(end, (day + 1) * 1440);
        windows.push({
          day,
          startMinute: cursor - day * 1440,
          endMinute: edge - day * 1440,
        });
        cursor = edge;
      }
      return windows;
    }),
  );
}

export function AvailabilityGrid({
  windows,
  disabled,
  onChange,
}: {
  windows: AvailabilityWindow[];
  disabled: boolean;
  onChange: (windows: AvailabilityWindow[]) => void;
}) {
  const [selection, select] = useState("");
  const blocks = continuousBlocks(windows);
  const selected = blocks.find((block) => blockId(block) === selection);
  const valid = ({ start, end }: Block) =>
    start >= 0 &&
    end <= 7 * 1440 &&
    end > start &&
    start % 30 === 0 &&
    end % 30 === 0;
  const apply = (id: string, next: Block) => {
    if (disabled || !valid(next)) return false;
    const merged = dailyWindows([
      ...blocks.filter((block) => blockId(block) !== id),
      next,
    ]);
    onChange(merged);
    const block = continuousBlocks(merged).find(
      (block) => block.start <= next.start && block.end >= next.end,
    )!;
    select(blockId(block));
    return true;
  };
  const updateBlock = ({
    event,
    revert,
  }: EventDropInfo | EventResizeDoneInfo) => {
    if (
      !event.start ||
      !event.end ||
      !apply(event.id, {
        start: weekMinute(event.start),
        end: weekMinute(event.end),
      })
    )
      revert();
  };
  return (
    <>
      <div className="flex flex-wrap items-end gap-2 border-b border-neutral-100 p-3 text-xs text-neutral-600">
        <label className="flex min-w-0 flex-col gap-1">
          Open hours
          <select
            className={calendarInput}
            disabled={disabled}
            value={selected ? blockId(selected) : ""}
            onChange={(e) => select(e.target.value)}
          >
            <option value="">New block</option>
            {blocks.map((block) => (
              <option key={blockId(block)} value={blockId(block)}>
                {weekdays[Math.floor(block.start / 1440)]}{" "}
                {timeLabel(block.start % 1440)}–{weekdays[endDay(block.end)]}{" "}
                {timeLabel(block.end - endDay(block.end) * 1440)}
              </option>
            ))}
          </select>
        </label>
        <BlockForm
          key={selected ? blockId(selected) : "new"}
          block={selected}
          disabled={disabled}
          onApply={(next) => apply(selected ? blockId(selected) : "", next)}
          onRemove={
            selected &&
            (() => {
              onChange(
                dailyWindows(
                  blocks.filter((block) => blockId(block) !== selection),
                ),
              );
              select("");
            })
          }
        />
      </div>
      <WeekCalendar
        initialDate={sunday}
        validRange={{ start: sunday, end: "2024-01-14" }}
        dayHeaderFormat={{ weekday: "short" }}
        editable={!disabled}
        selectable={!disabled}
        selectAllow={({ start, end }) =>
          valid({ start: weekMinute(start), end: weekMinute(end) })
        }
        eventAllow={({ start, end }) =>
          !disabled && valid({ start: weekMinute(start), end: weekMinute(end) })
        }
        events={blocks.map((block) => ({
          id: blockId(block),
          title: "Open",
          start: atMinute(sunday, block.start),
          end: atMinute(sunday, block.end),
          color: "var(--color-emerald-500)",
          contrastColor: "var(--color-emerald-900)",
          className:
            blockId(block) === selection ? selectedEventClass : undefined,
        }))}
        select={({ start, end, view }) => {
          apply("", { start: weekMinute(start), end: weekMinute(end) });
          view.calendar.unselect();
        }}
        eventClick={({ event }) => {
          if (!disabled) select(event.id);
        }}
        eventDrop={updateBlock}
        eventResize={updateBlock}
      />
    </>
  );
}

const toBlock = (v: WeekdayTimeRangeValue): Block => ({
  start: v.startDay * 1440 + v.startMinute,
  end: v.endDay * 1440 + v.endMinute,
});

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
  const [range, setRange] = useState<WeekdayTimeRangeValue>(() =>
    block
      ? {
          startDay: Math.floor(block.start / 1440),
          startMinute: block.start % 1440,
          endDay: endDay(block.end),
          endMinute: block.end - endDay(block.end) * 1440,
        }
      : { startDay: 0, startMinute: 540, endDay: 0, endMinute: 600 },
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
        <WeekdayTimeRange
          value={range}
          disabled={disabled}
          invalid={invalid}
          onChange={setRange}
        />
      </div>
      <button
        type="submit"
        disabled={disabled || invalid}
        className={calendarButton}
      >
        {block ? "Update open hours" : "Add open hours"}
      </button>
      {onRemove && (
        <button
          type="button"
          disabled={disabled}
          className={calendarButton}
          onClick={onRemove}
        >
          Remove block
        </button>
      )}
    </form>
  );
}
