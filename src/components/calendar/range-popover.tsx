import { type ReactNode, useId } from "react";
import { Popover } from "@base-ui/react/popover";
import { cn } from "cn";
import { CaretDownIcon } from "@/components/ui/icons/caret-icons";
import { DAY_MINUTES as DAY, timeLabel } from "@/utils/trip-time";
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
  icon,
  open,
  onOpenChange,
  disabled,
  children,
}: {
  label: string | null;
  placeholder: string;
  ariaLabel: string;
  icon?: ReactNode;
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
        className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-left text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {icon}
        <span className={label ? undefined : "text-neutral-400"}>
          {label ?? placeholder}
        </span>
        <CaretDownIcon
          aria-hidden="true"
          className="ml-auto size-5 shrink-0 fill-none stroke-neutral-500"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={8} className="z-50">
          <Popover.Popup
            aria-label={ariaLabel}
            className="max-h-[var(--available-height)] overflow-auto overscroll-contain rounded-2xl border border-neutral-100 bg-white p-4 text-neutral-800 shadow-xl outline-none"
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
  isDisabled,
  onChange,
}: {
  label: string;
  value: number;
  options: TimeOption[];
  disabled?: boolean;
  isDisabled?: (minute: number) => boolean;
  onChange: (minute: number) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="sr-only">{label}</span>
      <select
        className={cn(
          calendarInput,
          "min-h-12 w-full text-base font-semibold [text-align-last:center]",
        )}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={isDisabled?.(option.value)}
          >
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
  isAllowed,
  onChange,
}: {
  start: number;
  end: number;
  disabled?: boolean;
  invalid: boolean;
  /** Ranges that can't be picked. Starts at or after the end stay pickable so the end can follow. */
  isAllowed?: (start: number, end: number) => boolean;
  onChange: (start: number, end: number) => void;
}) {
  return (
    <div className="text-sm">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TimeSelect
          label="Start time"
          value={start}
          options={startTimes}
          disabled={disabled}
          isDisabled={(minute) =>
            !!isAllowed && minute < end && !isAllowed(minute, end)
          }
          onChange={(minute) => onChange(minute, end)}
        />
        <span aria-hidden="true" className="text-neutral-300">
          –
        </span>
        <TimeSelect
          label="End time"
          value={end}
          options={endTimes}
          disabled={disabled}
          isDisabled={(minute) =>
            !!isAllowed && minute > start && !isAllowed(start, minute)
          }
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
