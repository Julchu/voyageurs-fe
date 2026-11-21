import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { DayPicker } from "@daypicker/react";
import { dateLabel, dayOf, parseDate } from "./calendar-time";
import { RangePopover } from "./range-popover";
import { calendarButton, dayPickerClassNames, pickerFooter } from "./styles";

type Props = {
  startDate: string | null;
  endDate: string | null;
  disabled?: boolean;
  onChange: (startDate: string | null, endDate: string | null) => void;
};

export function TripDateRange({
  startDate,
  endDate,
  disabled,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() =>
    startDate ? parseDate(startDate) : new Date(),
  );
  const selected = startDate
    ? {
        from: parseDate(startDate),
        to: endDate ? parseDate(endDate) : undefined,
      }
    : undefined;
  const label = startDate
    ? `${dateLabel(startDate)} – ${endDate ? dateLabel(endDate) : "End date"}`
    : null;

  return (
    <RangePopover
      label={label}
      placeholder="Select trip duration"
      ariaLabel="Trip dates"
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setMonth(startDate ? parseDate(startDate) : new Date());
      }}
      disabled={disabled}
    >
      <DayPicker
        classNames={dayPickerClassNames}
        mode="range"
        timeZone="UTC"
        month={month}
        onMonthChange={setMonth}
        selected={selected}
        resetOnSelect
        max={365}
        disabled={disabled}
        onSelect={(range) => {
          onChange(
            range?.from ? dayOf(range.from) : null,
            range?.to ? dayOf(range.to) : null,
          );
          if (range?.to) setOpen(false);
        }}
      />
      <div className={pickerFooter}>
        <Button
          type="button"
          disabled={disabled}
          className={calendarButton}
          onClick={() => setMonth(new Date())}
        >
          Today
        </Button>
        <Button
          type="button"
          disabled={disabled || (!startDate && !endDate)}
          className={calendarButton}
          onClick={() => {
            onChange(null, null);
            setOpen(false);
          }}
        >
          Clear
        </Button>
      </div>
    </RangePopover>
  );
}
