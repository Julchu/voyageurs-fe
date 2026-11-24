import type { ClassNames } from "@daypicker/react";

const focusRing =
  "outline-blue-500 focus-visible:outline-2 focus-visible:-outline-offset-2";

export const calendarInput =
  "min-h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-50";

export const pickerFooter =
  "mt-3 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3";

/** Blue filled circle for a picked day (same as the range ends). */
export const pickedDay = "*:bg-blue-500 *:text-white";

const navButton = `inline-flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-blue-100 aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-transparent ${focusRing}`;
// Range ends: the half-strip only shows when the range continues on that side.
const rangeEdge = pickedDay;

/** Tailwind-only DayPicker styles (replaces @daypicker/react/style.css). */
export const dayPickerClassNames: Partial<ClassNames> = {
  root: "relative text-sm",
  months: "relative flex max-w-fit flex-wrap gap-8",
  month_caption: "flex h-11 items-center font-bold",
  caption_label: "relative z-1 inline-flex items-center whitespace-nowrap",
  nav: "absolute end-0 top-0 flex h-11 items-center",
  button_previous: navButton,
  button_next: navButton,
  chevron: "inline-block fill-blue-500",
  month_grid: "border-collapse",
  weekday: "py-2 text-xs font-medium text-neutral-500",
  day: "size-9 p-0 text-center [&:not([data-selected])>button:hover]:bg-blue-100",
  day_button: `flex size-9 cursor-pointer items-center justify-center rounded-full font-medium disabled:cursor-default ${focusRing}`,
  today: "text-blue-500",
  selected: "font-semibold",
  outside: "opacity-75",
  disabled: "[&:not([data-selected])]:opacity-50",
  hidden: "invisible",
  range_start: `from-transparent from-50% to-blue-50 to-50% [&:has(+[data-selected])]:bg-linear-to-r ${rangeEdge}`,
  range_middle: "bg-blue-50 *:rounded-none",
  range_end: `from-blue-50 from-50% to-transparent to-50% [[data-selected]+&]:bg-linear-to-r ${rangeEdge}`,
};
