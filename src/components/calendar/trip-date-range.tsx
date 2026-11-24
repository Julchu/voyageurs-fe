import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { DayPicker } from "@daypicker/react";
import { outlineButton } from "@/components/ui/button-styles";
import { CalendarIcon } from "@/components/ui/icons/planner-icons";
import { dateLabel, dayOf, parseDate } from "@/utils/trip-time";
import { RangePopover } from "./range-popover";
import { dayPickerClassNames, pickedDay, pickerFooter } from "./styles";

const yearOf = (date: string) => date.slice(0, 4);

/** The start shows its year only when the range crosses one. */
const rangeLabel = (startDate: string, endDate: string | null) =>
  `${dateLabel(startDate, !endDate || yearOf(endDate) !== yearOf(startDate))} – ${endDate ? dateLabel(endDate) : "End date"}`;

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
  const label = startDate ? rangeLabel(startDate, endDate) : null;

  return (
    <RangePopover
      label={label}
      placeholder="Select trip duration"
      ariaLabel="Trip dates"
      icon={
        <CalendarIcon
          aria-hidden="true"
          className="size-5 shrink-0 text-blue-500"
        />
      }
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
        // Range ends only style once both dates exist; circle a lone start.
        modifiers={{
          pendingStart: !!startDate && !endDate && parseDate(startDate),
        }}
        modifiersClassNames={{ pendingStart: pickedDay }}
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
          className={outlineButton}
          onClick={() => setMonth(new Date())}
        >
          Today
        </Button>
        <Button
          type="button"
          disabled={disabled || (!startDate && !endDate)}
          className={outlineButton}
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
