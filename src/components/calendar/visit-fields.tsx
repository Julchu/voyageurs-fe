import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { DayPicker } from "@daypicker/react";
import type { ScheduledVisit } from "@/types/trip-api";
import { timeLabel } from "@/utils/trip-calendar";
import { dateLabel, dayOf, parseDate, type Slot } from "./calendar-time";
import { DoneFooter, RangePopover, TimeRangeSelects } from "./range-popover";
import { calendarButton, dayPickerClassNames } from "./styles";

type VisitTime = Pick<ScheduledVisit, "date" | "startMinute" | "endMinute">;

/** One input for a visit's day and time. Visits can't cross midnight. */
function VisitTimePicker({
  value,
  dates,
  disabled,
  invalid,
  onChange,
}: {
  value: VisitTime;
  dates: string[];
  disabled?: boolean;
  invalid: boolean;
  onChange: (value: VisitTime) => void;
}) {
  const first = parseDate(dates[0]);
  const last = parseDate(dates.at(-1)!);
  const label = `${dateLabel(value.date, false)} · ${timeLabel(value.startMinute)}–${timeLabel(value.endMinute)}`;
  return (
    <RangePopover
      label={label}
      placeholder="Select visit time"
      ariaLabel="Visit time"
      disabled={disabled}
    >
      <DayPicker
        classNames={dayPickerClassNames}
        mode="single"
        required
        timeZone="UTC"
        defaultMonth={parseDate(value.date)}
        startMonth={first}
        endMonth={last}
        disabled={[{ before: first }, { after: last }]}
        selected={parseDate(value.date)}
        onSelect={(day) => day && onChange({ ...value, date: dayOf(day) })}
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

export function VisitFields({
  name,
  visit,
  dates,
  disabled,
  onPlace,
  onReserve,
  onRemove,
}: {
  name: string;
  visit?: ScheduledVisit;
  dates: string[];
  disabled: boolean;
  onPlace: (slot: Slot) => void;
  onReserve: () => void;
  onRemove: () => void;
}) {
  const locked = disabled || visit?.locked;
  const [time, setTime] = useState<VisitTime>(() => ({
    date: visit?.date ?? dates[0],
    startMinute: visit?.startMinute ?? 540,
    endMinute: visit?.endMinute ?? 570,
  }));
  const length = time.endMinute - time.startMinute;
  const invalid = length <= 0;
  const canPlace = !locked && dates.length > 0 && !invalid;
  return (
    <form
      className="space-y-2 text-xs text-neutral-600"
      onSubmit={(e) => {
        e.preventDefault();
        if (canPlace)
          onPlace({ date: time.date, startMinute: time.startMinute, length });
      }}
    >
      <p className="font-medium text-blue-700">
        {name}
        {visit?.locked && " · Reserved"}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        {dates.length ? (
          <div className="flex min-w-56 flex-col gap-1">
            Visit
            <VisitTimePicker
              value={time}
              dates={dates}
              disabled={locked}
              invalid={invalid}
              onChange={setTime}
            />
          </div>
        ) : (
          <p className="text-neutral-500">Set trip dates to schedule visits.</p>
        )}
        <Button type="submit" className={calendarButton} disabled={!canPlace}>
          {visit ? "Update visit" : "Schedule visit"}
        </Button>
        {visit && (
          <>
            <Button
              type="button"
              className={calendarButton}
              disabled={disabled}
              onClick={onReserve}
            >
              {visit.locked ? "Unreserve" : "Reserve"}
            </Button>
            <Button
              type="button"
              className={calendarButton}
              disabled={disabled}
              onClick={onRemove}
            >
              Remove visit
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
