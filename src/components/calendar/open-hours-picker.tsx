import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { weekdays } from "./calendar-time";
import { type WeekdayRange, weekdayRangeLabel } from "./open-hours";
import { DoneFooter, RangePopover, TimeRangeSelects } from "./range-popover";

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
          <Button
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
          </Button>
        );
      })}
    </div>
  );
}

/** One input for an open-hours block: start/end weekday and time. */
export function OpenHoursPicker({
  value,
  disabled,
  invalid,
  onChange,
}: {
  value: WeekdayRange;
  disabled?: boolean;
  invalid: boolean;
  onChange: (value: WeekdayRange) => void;
}) {
  const label = weekdayRangeLabel(value);
  return (
    <RangePopover
      label={label}
      placeholder="Select open hours"
      ariaLabel="Open hours"
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
      <DoneFooter>{label}</DoneFooter>
    </RangePopover>
  );
}
