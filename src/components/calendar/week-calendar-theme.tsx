import type { CalendarOptions } from "@fullcalendar/react";
import { cn } from "cn";
import { CaretDownIcon } from "@/components/ui/icons/caret-icons";

// Tailwind-only FullCalendar theme for the timeGrid views (replaces the Forma
// theme CSS). Based on FullCalendar's shadcn "forma" theme, trimmed to the
// parts WeekCalendar uses.
// TODO: add all-day/dayGrid/list/more-link/popover classes if those views get used.

const border = "border border-neutral-200";
const muted = "bg-neutral-50";
const focusRing =
  "outline-blue-500 focus-visible:outline-2 focus-visible:-outline-offset-2";
const resizer = "absolute hidden group-hover:block";

/** Outline for an event the user picked (matches FullCalendar's own selection). */
export const selectedEventClass =
  "outline-2 -outline-offset-2 outline-blue-500";

export const weekCalendarTheme: CalendarOptions = {
  /* Toolbar */
  toolbarClass:
    "flex items-center justify-between gap-2 border-b border-neutral-200 px-2 py-1.5",
  toolbarSectionClass: "flex items-center gap-1",
  toolbarTitleClass: "text-sm font-semibold",
  buttonGroupClass: "flex items-center",
  buttonClass: `inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-600 hover:bg-blue-100 disabled:pointer-events-none disabled:opacity-40 ${focusRing}`,
  buttons: {
    prev: {
      iconContent: () => (
        <CaretDownIcon className="size-5 rotate-90 fill-none stroke-current" />
      ),
    },
    next: {
      iconContent: () => (
        <CaretDownIcon className="size-5 -rotate-90 fill-none stroke-current" />
      ),
    },
  },

  /* Events: colors come from each event's `color` / `contrastColor` */
  eventColor: "var(--color-blue-500)",
  eventContrastColor: "var(--color-blue-900)",
  eventClass: (info) =>
    cn(
      info.isSelected ? "outline-2" : "focus-visible:outline-2",
      "-outline-offset-2 outline-blue-500",
      info.isDragging && "opacity-75",
    ),
  blockEventClass:
    "group relative overflow-hidden rounded-md border border-[color-mix(in_oklab,var(--fc-event-color)_35%,white)] bg-[color-mix(in_oklab,var(--fc-event-color)_8%,white)] text-(--fc-event-contrast-color)",
  blockEventTimeClass: "shrink overflow-hidden whitespace-nowrap",
  blockEventTitleClass: "shrink-100 overflow-hidden whitespace-nowrap",

  /* Column (timed) events */
  columnEventClass: (info) => cn(info.isEnd && "mb-px"),
  columnEventBeforeClass: (info) =>
    cn(info.isStartResizable && `${resizer} inset-x-0 -top-1 h-2`),
  columnEventAfterClass: (info) =>
    cn(info.isEndResizable && `${resizer} inset-x-0 -bottom-1 h-2`),
  columnEventInnerClass: (info) =>
    cn(
      "flex",
      info.isShort ? "flex-row items-center gap-1 p-1" : "flex-col px-1",
    ),
  columnEventTimeClass: (info) => cn(!info.isShort && "pt-1", "text-[11px]"),
  columnEventTitleClass: (info) => cn(!info.isShort && "py-1", "font-medium"),

  /* Day headers, cells and lanes */
  dayHeaderAlign: "center",
  dayHeaderRowClass: border,
  dayHeaderClass: (info) =>
    cn("justify-center", border, info.isDisabled && muted),
  dayHeaderInnerClass: (info) =>
    cn(
      "flex flex-col p-2 font-medium",
      info.isToday && "font-semibold text-blue-600",
    ),
  dayHeaderDividerClass: "border-b border-neutral-200",
  dayRowClass: border,
  dayCellClass: (info) => cn(border, info.isDisabled && muted),
  dayCellBottomClass: "min-h-4",
  dayLaneClass: (info) => cn(border, info.isDisabled && muted),
  dayLaneInnerClass: (info) => (info.isStack ? "m-1" : "ms-0.5 me-[2.5%]"),

  /* Time slots */
  slotLaneClass: (info) =>
    cn("border", info.isMinor ? "border-neutral-100" : "border-neutral-200"),
  slotHeaderRowClass: border,
  slotHeaderClass: "justify-end",
  slotHeaderInnerClass: "m-1.5 text-[10px] tabular-nums text-neutral-500",
  slotHeaderDividerClass: "border-e border-neutral-200",

  /* Misc */
  tableHeaderClass: "bg-white",
  fillerClass: `${border} opacity-50`,
  nonBusinessHoursClass: "bg-neutral-100",
  highlightClass: "bg-blue-100",
  nowIndicatorLineClass: "-m-px border border-blue-500",
  nowIndicatorDotClass:
    "-m-1.5 size-0 rounded-full border-6 border-blue-500 shadow-[0_0_0_2px_white]",
};
