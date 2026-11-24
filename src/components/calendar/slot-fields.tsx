import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { DayPicker } from "@daypicker/react";
import type { TimeSlot } from "@/types/trip-api";
import { dateLabel, dayOf, parseDate, timeLabel } from "@/utils/trip-time";
import type { SlotTime } from "./calendar-time";
import { DoneFooter, RangePopover, TimeRangeSelects } from "./range-popover";
import { calendarButton, dayPickerClassNames } from "./styles";

/** One input for a time slot's day and time. Time slots can't cross midnight. */
function SlotTimePicker({
  value,
  dates,
  disabled,
  invalid,
  onChange,
}: {
  value: SlotTime;
  dates: string[];
  disabled?: boolean;
  invalid: boolean;
  onChange: (value: SlotTime) => void;
}) {
  const first = parseDate(dates[0]);
  const last = parseDate(dates.at(-1)!);
  const label = `${dateLabel(value.date, false)} · ${timeLabel(value.startMinute)}–${timeLabel(value.endMinute)}`;
  return (
    <RangePopover
      label={label}
      placeholder="Select time slot"
      ariaLabel="Time slot"
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

export function SlotFields({
  name,
  slot,
  dates,
  disabled,
  onPlace,
  onReserve,
  onRemove,
}: {
  name: string;
  slot?: TimeSlot;
  dates: string[];
  disabled: boolean;
  onPlace: (time: SlotTime) => void;
  onReserve: () => void;
  onRemove: () => void;
}) {
  const locked = disabled || slot?.locked;
  const [time, setTime] = useState<SlotTime>(() => ({
    date: slot?.date ?? dates[0],
    startMinute: slot?.startMinute ?? 540,
    endMinute: slot?.endMinute ?? 570,
  }));
  const invalid = time.endMinute <= time.startMinute;
  const canPlace = !locked && dates.length > 0 && !invalid;
  return (
    <form
      className="space-y-2 text-xs text-neutral-600"
      onSubmit={(e) => {
        e.preventDefault();
        if (canPlace) onPlace(time);
      }}
    >
      <p className="font-medium text-blue-700">
        {name}
        {slot?.locked && " · Reserved"}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        {dates.length ? (
          <div className="flex min-w-56 flex-col gap-1">
            Time slot
            <SlotTimePicker
              value={time}
              dates={dates}
              disabled={locked}
              invalid={invalid}
              onChange={setTime}
            />
          </div>
        ) : (
          <p className="text-neutral-500">Set trip dates to add time slots.</p>
        )}
        <Button type="submit" className={calendarButton} disabled={!canPlace}>
          {slot ? "Update time slot" : "Add time slot"}
        </Button>
        {slot && (
          <>
            <Button
              type="button"
              className={calendarButton}
              disabled={disabled}
              onClick={onReserve}
            >
              {slot.locked ? "Unreserve" : "Reserve"}
            </Button>
            <Button
              type="button"
              className={calendarButton}
              disabled={disabled}
              onClick={onRemove}
            >
              Remove time slot
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
