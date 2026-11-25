import type { CalendarOptions } from "@fullcalendar/react";
import { cn } from "cn";

// Tailwind-only FullCalendar theme for the timeGrid views (replaces the Forma
// theme CSS). Based on FullCalendar's shadcn "forma" theme, trimmed to the
// parts WeekCalendar uses. Views bring their own header (no FC toolbar).
// TODO: add all-day/dayGrid/list/more-link/popover classes if those views get used.

const border = "border border-neutral-100";
const muted = "bg-neutral-50";
// Resize hit area spans the event edge; the visible part is a small pill.
const resizer =
  "absolute z-10 hidden group-hover:block after:absolute after:top-1/2 after:left-1/2 after:h-1.5 after:w-6 after:-translate-1/2 after:rounded-full after:border after:border-blue-500 after:bg-white";

/** Outline for an event the user picked (matches FullCalendar's own selection). */
export const selectedEventClass =
  "outline-2 -outline-offset-2 outline-blue-500 ring-4 ring-blue-100";

/** Diagonal stripes for closed hours. */
const closedStripes =
  "bg-[repeating-linear-gradient(-45deg,var(--color-neutral-200)_0_1px,transparent_1px_8px)]";

export const weekCalendarTheme: CalendarOptions = {
  /* Events: colors come from each event's `color` / `contrastColor` */
  eventColor: "var(--color-blue-500)",
  eventContrastColor: "var(--color-blue-950)",
  eventClass: (info) =>
    cn(
      info.isSelected ? "outline-2" : "focus-visible:outline-2",
      "-outline-offset-2 outline-blue-500",
      info.isDragging && "opacity-90 shadow-xl",
    ),
  blockEventClass:
    "group relative overflow-hidden rounded-xl border border-l-4 border-[color-mix(in_oklab,var(--fc-event-color)_30%,white)] border-l-(--fc-event-color) bg-[color-mix(in_oklab,var(--fc-event-color)_8%,white)] text-(--fc-event-contrast-color)",
  blockEventTimeClass:
    "shrink overflow-hidden font-semibold whitespace-nowrap text-[color-mix(in_oklab,var(--fc-event-color)_75%,black)]",
  blockEventTitleClass: "shrink-100 overflow-hidden font-bold",

  /* Column (timed) events */
  columnEventClass: (info) => cn(info.isEnd && "mb-px"),
  columnEventBeforeClass: (info) =>
    cn(info.isStartResizable && `${resizer} inset-x-0 -top-1 h-2`),
  columnEventAfterClass: (info) =>
    cn(info.isEndResizable && `${resizer} inset-x-0 -bottom-1 h-2`),
  columnEventInnerClass: (info) =>
    cn(
      "flex",
      info.isShort
        ? "flex-row items-center gap-1 px-1.5 py-0.5"
        : "flex-col gap-0.5 px-2 py-1.5",
    ),
  columnEventTimeClass: "text-[11px]",
  columnEventTitleClass: (info) =>
    cn("text-xs", info.isShort ? "truncate" : "line-clamp-3"),

  /* Day headers, cells and lanes */
  dayHeaderAlign: "center",
  dayHeaderRowClass: border,
  dayHeaderClass: (info) =>
    cn("justify-center", border, info.isDisabled && muted),
  dayHeaderInnerClass: (info) =>
    cn(
      "flex flex-col items-center gap-0.5 px-1 py-2.5 text-xs font-medium text-neutral-500 md:flex-row md:gap-1.5 md:py-3 md:text-sm",
      info.isToday && "text-blue-500",
    ),
  dayHeaderContent: (info) => (
    <>
      {info.weekdayText}
      {info.dayNumberText && (
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-base font-bold",
            info.isToday ? "bg-blue-500 text-white" : "text-neutral-900",
          )}
        >
          {info.dayNumberText}
        </span>
      )}
    </>
  ),
  dayHeaderDividerClass: "border-b border-neutral-200",
  dayRowClass: border,
  dayCellClass: (info) => cn(border, info.isDisabled && muted),
  dayCellBottomClass: "min-h-4",
  dayLaneClass: (info) => cn(border, info.isDisabled && muted),
  dayLaneInnerClass: (info) => (info.isStack ? "m-1" : "ms-1 me-[3%]"),

  /* Time slots */
  slotLaneClass: (info) =>
    cn("border", info.isMinor ? "border-transparent" : "border-neutral-100"),
  slotHeaderRowClass: border,
  slotHeaderClass: "justify-end",
  slotHeaderInnerClass: "m-2 text-xs tabular-nums text-neutral-400",
  slotHeaderDividerClass: "border-e border-neutral-100",

  /* Misc */
  tableHeaderClass: "bg-white",
  fillerClass: `${border} opacity-50`,
  nonBusinessHoursClass: closedStripes,
  highlightClass: "bg-blue-100",
  nowIndicatorLineClass: "-m-px border border-blue-500",
  nowIndicatorDotClass:
    "-m-1.5 size-0 rounded-full border-6 border-blue-500 shadow-[0_0_0_2px_white]",
};
