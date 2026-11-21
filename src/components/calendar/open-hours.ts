import type { AvailabilityWindow } from "@/types/trip-api";
import { timeLabel } from "@/utils/trip-calendar";
import { DAY, weekdays } from "./calendar-time";

const WEEK = 7 * DAY;

/** An open-hours block in minutes from Sunday 00:00. It can span days. */
export type Block = { start: number; end: number };

/** The same block as weekday + time fields, for the picker. */
export type WeekdayRange = {
  startDay: number;
  startMinute: number;
  endDay: number;
  endMinute: number;
};

export const blockId = (block: Block) => `${block.start}:${block.end}`;

export const isValidBlock = ({ start, end }: Block) =>
  start >= 0 &&
  end <= WEEK &&
  end > start &&
  start % 30 === 0 &&
  end % 30 === 0;

export const toBlock = (range: WeekdayRange): Block => ({
  start: range.startDay * DAY + range.startMinute,
  end: range.endDay * DAY + range.endMinute,
});

export const fromBlock = ({ start, end }: Block): WeekdayRange => {
  const endDay = Math.ceil(end / DAY) - 1;
  return {
    startDay: Math.floor(start / DAY),
    startMinute: start % DAY,
    endDay,
    endMinute: end - endDay * DAY,
  };
};

const shortWeekday = (day: number) => weekdays[day].slice(0, 3);

export const weekdayRangeLabel = ({
  startDay,
  startMinute,
  endDay,
  endMinute,
}: WeekdayRange) =>
  startDay === endDay
    ? `${shortWeekday(startDay)} · ${timeLabel(startMinute)}–${timeLabel(endMinute)}`
    : `${shortWeekday(startDay)} ${timeLabel(startMinute)} – ${shortWeekday(endDay)} ${timeLabel(endMinute)}`;

/** Sorted open hours, with overlapping windows on the same day joined. */
const mergeHours = (windows: AvailabilityWindow[]) => {
  const result: AvailabilityWindow[] = [];
  const sorted = [...windows].sort(
    (a, b) => a.day - b.day || a.startMinute - b.startMinute,
  );
  for (const next of sorted) {
    const last = result.at(-1);
    if (last && last.day === next.day && next.startMinute <= last.endMinute)
      last.endMinute = Math.max(last.endMinute, next.endMinute);
    else result.push({ ...next });
  }
  return result;
};

/** Daily windows joined into blocks, so hours past midnight read as one block. */
export function toBlocks(windows: AvailabilityWindow[]) {
  const blocks: Block[] = [];
  for (const window of mergeHours(windows)) {
    const start = window.day * DAY + window.startMinute;
    const end = window.day * DAY + window.endMinute;
    const last = blocks.at(-1);
    if (last && last.end === start) last.end = end;
    else blocks.push({ start, end });
  }
  return blocks;
}

/** Blocks cut back into one window per day, the shape the backend stores. */
export function toWindows(blocks: Block[]) {
  const windows: AvailabilityWindow[] = [];
  for (const { start, end } of blocks) {
    for (let cursor = start; cursor < end; ) {
      const day = Math.floor(cursor / DAY);
      const dayEnd = Math.min(end, (day + 1) * DAY);
      windows.push({
        day,
        startMinute: cursor - day * DAY,
        endMinute: dayEnd - day * DAY,
      });
      cursor = dayEnd;
    }
  }
  return mergeHours(windows);
}

/** FullCalendar business hours. No hours means open anytime, so nothing is shaded. */
export const toBusinessHours = (windows: AvailabilityWindow[]) =>
  windows.length
    ? windows.map((window) => ({
        daysOfWeek: [window.day],
        startTime: timeLabel(window.startMinute),
        endTime: timeLabel(window.endMinute),
      }))
    : false;
