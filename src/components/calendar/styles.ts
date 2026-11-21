import type { ClassNames } from "@daypicker/react";

const focusRing =
  "outline-blue-500 focus-visible:outline-2 focus-visible:-outline-offset-2";

export const calendarButton =
  "inline-flex min-h-9 items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40";

export const linkButton =
  "text-[10px] font-medium text-blue-600 hover:underline focus-visible:outline-blue-500 disabled:opacity-50";

export const calendarInput =
  "min-h-9 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-800 outline-none disabled:opacity-50";

export const pickerFooter =
  "mt-2 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2";

const navButton = `inline-flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-blue-100 aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-transparent ${focusRing}`;
// Range ends: the half-strip only shows when the range continues on that side.
const rangeEdge = "*:bg-blue-500 *:text-white";

/** Tailwind-only DayPicker styles (replaces @daypicker/react/style.css). */
export const dayPickerClassNames: Partial<ClassNames> = {
  root: "relative text-sm",
  months: "relative flex max-w-fit flex-wrap gap-8",
  month_caption: "flex h-11 items-center font-semibold",
  caption_label: "relative z-1 inline-flex items-center whitespace-nowrap",
  nav: "absolute end-0 top-0 flex h-11 items-center",
  button_previous: navButton,
  button_next: navButton,
  chevron: "inline-block fill-blue-500",
  month_grid: "border-collapse",
  weekday: "py-2 text-xs font-medium opacity-75",
  day: "size-9 p-0 text-center [&:not([data-selected])>button:hover]:bg-blue-100",
  day_button: `flex size-9 cursor-pointer items-center justify-center rounded-lg disabled:cursor-default ${focusRing}`,
  today: "text-blue-500",
  selected: "font-semibold",
  outside: "opacity-75",
  disabled: "[&:not([data-selected])]:opacity-50",
  hidden: "invisible",
  range_start: `from-transparent from-50% to-blue-50 to-50% [&:has(+[data-selected])]:bg-linear-to-r ${rangeEdge}`,
  range_middle: "bg-blue-50 *:rounded-none",
  range_end: `from-blue-50 from-50% to-transparent to-50% [[data-selected]+&]:bg-linear-to-r ${rangeEdge}`,
};
