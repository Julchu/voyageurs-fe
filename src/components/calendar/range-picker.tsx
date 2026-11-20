import { type ReactNode, useId, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { type ClassNames, DayPicker } from "@daypicker/react";
import { CaretDownIcon } from "@/components/ui/icons/caret-icons";
import { timeLabel } from "@/utils/trip-calendar";
import { timeOptions, weekdays } from "./calendar-time";
import { calendarButton, calendarInput } from "./styles";

export const parseDate = (date: string) => new Date(`${date}T00:00:00Z`);
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
export const dateLabel = (date: string, withYear = true) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(parseDate(date));

const focusRing =
  "outline-blue-500 focus-visible:outline-2 focus-visible:-outline-offset-2";
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
export const pickerFooter =
  "mt-2 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2";

const starts = timeOptions();
const ends = [...starts, { value: 1440, label: "24:00" }];

/** Trigger button + popover shared by every range input in the calendar. */
export function RangePopover({
  label,
  placeholder,
  ariaLabel,
  open,
  onOpenChange,
  disabled,
  children,
}: {
  label: string | null;
  placeholder: string;
  ariaLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger
        id={id}
        disabled={disabled}
        aria-label={`${ariaLabel}: ${label ?? placeholder}`}
        className={`${calendarInput} flex w-full cursor-pointer items-center justify-between gap-3 text-left`}
      >
        <span className={label ? undefined : "text-neutral-400"}>
          {label ?? placeholder}
        </span>
        <CaretDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 stroke-neutral-400"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={8} className="z-50">
          <Popover.Popup
            aria-label={ariaLabel}
            className="max-h-[var(--available-height)] overflow-auto overscroll-contain rounded-xl border border-neutral-200 bg-white p-3 text-neutral-800 shadow-lg outline-none"
          >
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function TimeRangeSelects({
  start,
  end,
  disabled,
  invalid,
  onChange,
}: {
  start: number;
  end: number;
  disabled?: boolean;
  invalid: boolean;
  onChange: (start: number, end: number) => void;
}) {
  return (
    <div className="mt-2 border-t border-neutral-100 pt-2 text-xs text-neutral-600">
      <div className="grid grid-cols-2 gap-2">
        {(["start", "end"] as const).map((edge) => (
          <label key={edge} className="flex min-w-0 flex-col gap-1">
            {edge === "start" ? "Start time" : "End time"}
            <select
              className={calendarInput}
              disabled={disabled}
              value={edge === "start" ? start : end}
              onChange={(e) => {
                const minute = Number(e.target.value);
                if (edge === "start") onChange(minute, end);
                else onChange(start, minute);
              }}
            >
              {(edge === "start" ? starts : ends).map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {invalid && (
        <p role="alert" className="mt-2 text-red-600">
          End must be after start.
        </p>
      )}
    </div>
  );
}

function DoneFooter({ children }: { children?: ReactNode }) {
  return (
    <div className={pickerFooter}>
      <span className="text-xs text-neutral-500">{children}</span>
      <Popover.Close className={calendarButton}>Done</Popover.Close>
    </div>
  );
}

export type DateTimeRangeValue = {
  date: string;
  startMinute: number;
  endDate: string;
  endMinute: number;
};

const dateTimeLabel = ({
  date,
  startMinute,
  endDate,
  endMinute,
}: DateTimeRangeValue) =>
  date === endDate
    ? `${dateLabel(date, false)} · ${timeLabel(startMinute)}–${timeLabel(endMinute)}`
    : `${dateLabel(date, false)}, ${timeLabel(startMinute)} – ${dateLabel(endDate, false)}, ${timeLabel(endMinute)}`;

/** One input for a visit's start/end date and time, limited to the trip's days. */
export function DateTimeRange({
  value,
  minDate,
  maxDate,
  disabled,
  invalid,
  onChange,
}: {
  value: DateTimeRangeValue;
  minDate: string;
  maxDate: string;
  disabled?: boolean;
  invalid: boolean;
  onChange: (value: DateTimeRangeValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const min = parseDate(minDate);
  const max = parseDate(maxDate);
  return (
    <RangePopover
      label={dateTimeLabel(value)}
      placeholder="Select visit time"
      ariaLabel="Visit time"
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setPicking(false);
      }}
      disabled={disabled}
    >
      <DayPicker
        classNames={dayPickerClassNames}
        mode="range"
        required
        resetOnSelect
        timeZone="UTC"
        defaultMonth={parseDate(value.date)}
        startMonth={min}
        endMonth={max}
        disabled={[{ before: min }, { after: max }]}
        selected={{
          from: parseDate(value.date),
          to: picking ? undefined : parseDate(value.endDate),
        }}
        onSelect={(range) => {
          if (!range.from) return;
          // A single click is a one-day visit; a second click extends it.
          setPicking(!range.to);
          onChange({
            ...value,
            date: isoDate(range.from),
            endDate: isoDate(range.to ?? range.from),
          });
        }}
      />
      <TimeRangeSelects
        start={value.startMinute}
        end={value.endMinute}
        disabled={disabled}
        invalid={invalid}
        onChange={(startMinute, endMinute) =>
          onChange({ ...value, startMinute, endMinute })
        }
      />
      <DoneFooter>{dateTimeLabel(value)}</DoneFooter>
    </RangePopover>
  );
}

export type WeekdayTimeRangeValue = {
  startDay: number;
  startMinute: number;
  endDay: number;
  endMinute: number;
};

const shortWeekday = (day: number) => weekdays[day].slice(0, 3);
const weekdayTimeLabel = ({
  startDay,
  startMinute,
  endDay,
  endMinute,
}: WeekdayTimeRangeValue) =>
  startDay === endDay
    ? `${shortWeekday(startDay)} · ${timeLabel(startMinute)}–${timeLabel(endMinute)}`
    : `${shortWeekday(startDay)} ${timeLabel(startMinute)} – ${shortWeekday(endDay)} ${timeLabel(endMinute)}`;

/** Range selection over Sunday–Saturday, styled to match DayPicker. */
function WeekdayRangeGrid({
  startDay,
  endDay,
  disabled,
  onChange,
}: {
  startDay: number;
  endDay: number;
  disabled?: boolean;
  onChange: (startDay: number, endDay: number) => void;
}) {
  // Same as DayPicker's resetOnSelect: first click starts a range, second ends it.
  const [picking, setPicking] = useState(false);
  return (
    <div
      role="group"
      aria-label="Days"
      className="grid grid-cols-7 gap-y-1 text-sm"
    >
      {weekdays.map((name, day) => {
        const edge = day === startDay || day === endDay;
        const inside = day > startDay && day < endDay;
        return (
          <button
            key={name}
            type="button"
            disabled={disabled}
            aria-label={name}
            aria-pressed={edge || inside}
            onClick={() => {
              if (picking)
                onChange(Math.min(startDay, day), Math.max(startDay, day));
              else onChange(day, day);
              setPicking(!picking);
            }}
            className={`h-9 w-11 cursor-pointer font-medium outline-blue-500 focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
              edge
                ? "rounded-lg bg-blue-500 font-semibold text-white"
                : inside
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "rounded-lg hover:bg-blue-100"
            }`}
          >
            {name.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
}

/** One input for an open-hours block: start/end weekday and time. */
export function WeekdayTimeRange({
  value,
  disabled,
  invalid,
  onChange,
}: {
  value: WeekdayTimeRangeValue;
  disabled?: boolean;
  invalid: boolean;
  onChange: (value: WeekdayTimeRangeValue) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <RangePopover
      label={weekdayTimeLabel(value)}
      placeholder="Select open hours"
      ariaLabel="Open hours"
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
    >
      <WeekdayRangeGrid
        startDay={value.startDay}
        endDay={value.endDay}
        disabled={disabled}
        onChange={(startDay, endDay) =>
          onChange({ ...value, startDay, endDay })
        }
      />
      <TimeRangeSelects
        start={value.startMinute}
        end={value.endMinute}
        disabled={disabled}
        invalid={invalid}
        onChange={(startMinute, endMinute) =>
          onChange({ ...value, startMinute, endMinute })
        }
      />
      <DoneFooter>{weekdayTimeLabel(value)}</DoneFooter>
    </RangePopover>
  );
}
