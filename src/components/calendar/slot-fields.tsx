import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { DayPicker } from "@daypicker/react";
import { outlineButton } from "@/components/ui/button-styles";
import { XIcon } from "@/components/ui/icons/close-icons";
import type { TimeSlot } from "@/types/trip-api";
import { dateLabel, dayOf, parseDate, timeLabel } from "@/utils/trip-time";
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
  onClose,
}: {
  slot?: TimeSlot;
  dates: string[];
  disabled: boolean;
  fits: (time: SlotTime) => boolean;
  onPlace: (time: SlotTime) => void;
  onReserve: () => void;
  onClose: () => void;
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
    <div
      // Phones: unwrapped so the picker shares a row with the day arrows.
      className="contents text-sm md:flex md:min-w-0 md:flex-1 md:flex-wrap md:items-center md:gap-2"
    >
      <div className="min-w-44 flex-1 max-md:order-first">
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
          className={outlineButton}
          disabled={disabled}
          onClick={onReserve}
        >
          {slot.locked ? "Unreserve" : "Reserve"}
        </Button>
      )}
      <Button
        type="button"
        aria-label="Stop placing"
        onClick={onClose}
        className="flex size-8 cursor-pointer items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
      >
        <XIcon aria-hidden="true" className="size-5 stroke-current" />
      </Button>
    </div>
  );
}
