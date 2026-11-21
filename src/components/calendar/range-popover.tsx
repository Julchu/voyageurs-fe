import { type ReactNode, useId } from "react";
import { Popover } from "@base-ui/react/popover";
import { CaretDownIcon } from "@/components/ui/icons/caret-icons";
import { timeLabel } from "@/utils/trip-calendar";
import { DAY } from "./calendar-time";
import { calendarButton, calendarInput, pickerFooter } from "./styles";

type TimeOption = { value: number; label: string };
const timeOption = (value: number): TimeOption => ({
  value,
  label: timeLabel(value),
});
const startTimes = Array.from({ length: DAY / 30 }, (_, i) =>
  timeOption(i * 30),
);
const endTimes = [...startTimes, timeOption(DAY)];

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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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

function TimeSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  options: TimeOption[];
  disabled?: boolean;
  onChange: (minute: number) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      {label}
      <select
        className={calendarInput}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TimeRangeSelects({
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
        <TimeSelect
          label="Start time"
          value={start}
          options={startTimes}
          disabled={disabled}
          onChange={(minute) => onChange(minute, end)}
        />
        <TimeSelect
          label="End time"
          value={end}
          options={endTimes}
          disabled={disabled}
          onChange={(minute) => onChange(start, minute)}
        />
      </div>
      {invalid && (
        <p role="alert" className="mt-2 text-red-600">
          End must be after start.
        </p>
      )}
    </div>
  );
}

export function DoneFooter({ children }: { children?: ReactNode }) {
  return (
    <div className={pickerFooter}>
      <span className="text-xs text-neutral-500">{children}</span>
      <Popover.Close className={calendarButton}>Done</Popover.Close>
    </div>
  );
}
