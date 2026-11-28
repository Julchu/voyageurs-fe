import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { cn } from "cn";
import { DayPicker } from "@daypicker/react";
import { outlineButton } from "@/components/ui/button-styles";
import {
  CalendarCheckIcon,
  CalendarXIcon,
} from "@/components/ui/icons/planner-icons";
import type { TimeSlot } from "@/types/trip-api";
import { dayOf, parseDate, timeLabel } from "@/utils/trip-time";
import type { SlotTime } from "./calendar-time";
import { RangePopover, TimeRangeSelects } from "./range-popover";
import { dayPickerClassNames, pickedDay } from "./styles";

/** One input for a time slot's day and time. Time slots can't cross midnight. */
function SlotTimePicker({
  value,
  dates,
  disabled,
  invalid,
  fits,
  onChange,
}: {
  value: SlotTime;
  dates: string[];
  disabled?: boolean;
  invalid: boolean;
  /** False for times that overlap another stop, are closed, or are outside the trip. */
  fits: (time: SlotTime) => boolean;
  onChange: (value: SlotTime) => void;
}) {
  const first = parseDate(dates[0]);
  const last = parseDate(dates.at(-1)!);
  const label = `${timeLabel(value.startMinute)}–${timeLabel(value.endMinute)}`;
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
        disabled={[
          { before: first },
          { after: last },
          (day) => !invalid && !fits({ ...value, date: dayOf(day) }),
        ]}
        selected={parseDate(value.date)}
        modifiersClassNames={{ selected: pickedDay }}
        onSelect={(day) => day && onChange({ ...value, date: dayOf(day) })}
      />
      <div className="mt-3 border-t border-neutral-100 pt-3">
        <TimeRangeSelects
          start={value.startMinute}
          end={value.endMinute}
          disabled={disabled}
          invalid={invalid}
          isAllowed={(startMinute, endMinute) =>
            fits({ ...value, startMinute, endMinute })
          }
          onChange={(startMinute, endMinute) =>
            onChange({ ...value, startMinute, endMinute })
          }
        />
      </div>
    </RangePopover>
  );
}

/** Picking a day or time places the selected stop right away. Removing happens on the calendar event. */
export function SlotFields({
  slot,
  dates,
  disabled,
  fits,
  onPlace,
  onReserve,
}: {
  slot?: TimeSlot;
  dates: string[];
  disabled: boolean;
  fits: (time: SlotTime) => boolean;
  onPlace: (time: SlotTime) => void;
  onReserve: () => void;
}) {
  const fromSlot = (): SlotTime => ({
    date: slot?.date ?? dates[0],
    startMinute: slot?.startMinute ?? 540,
    endMinute: slot?.endMinute ?? 570,
  });
  const [time, setTime] = useState(fromSlot);
  // Follow moves made on the calendar (drag, resize, click).
  const slotKey = slot && `${slot.date}/${slot.startMinute}/${slot.endMinute}`;
  const [seenKey, setSeenKey] = useState(slotKey);
  if (slotKey !== seenKey) {
    setSeenKey(slotKey);
    setTime(fromSlot());
  }
  const invalid = time.endMinute <= time.startMinute;
  const change = (next: SlotTime) => {
    setTime(next);
    if (next.endMinute > next.startMinute) onPlace(next);
  };
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
      <div className="min-w-0 flex-1">
        <SlotTimePicker
          value={time}
          dates={dates}
          disabled={disabled || slot?.locked}
          invalid={invalid}
          fits={fits}
          onChange={change}
        />
      </div>
      {slot && (
        <Button
          type="button"
          // Phones: icon only.
          className={cn(outlineButton, "max-md:size-10 max-md:px-0")}
          disabled={disabled}
          onClick={onReserve}
        >
          {slot.locked ? (
            <CalendarXIcon aria-hidden="true" className="size-5" />
          ) : (
            <CalendarCheckIcon aria-hidden="true" className="size-5" />
          )}
          <span className="max-md:sr-only">
            {slot.locked ? "Unreserve" : "Reserve"}
          </span>
        </Button>
      )}
    </div>
  );
}
