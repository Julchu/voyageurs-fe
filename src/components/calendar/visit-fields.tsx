import { useState } from "react";
import type { ScheduledVisit } from "@/types/trip-api";
import { calendarButton } from "./styles";
import { atMinute } from "./calendar-time";
import { DateTimeRange, type DateTimeRangeValue } from "./range-picker";

const lengthOf = ({
  date,
  startMinute,
  endDate,
  endMinute,
}: DateTimeRangeValue) =>
  (atMinute(endDate, endMinute).getTime() -
    atMinute(date, startMinute).getTime()) /
  60_000;

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
  onPlace: (date: string, minute: number, duration: number) => void;
  onReserve: () => void;
  onRemove: () => void;
}) {
  const locked = disabled || visit?.locked;
  const [range, setRange] = useState<DateTimeRangeValue>(() => ({
    date: visit?.date ?? dates[0],
    startMinute: visit?.startMinute ?? 540,
    // TODO: Limit the picker to one day; visits can't cross midnight.
    endDate: visit?.date ?? dates[0],
    endMinute: visit?.endMinute ?? 570,
  }));
  const invalid = lengthOf(range) <= 0;
  return (
    <form
      className="space-y-2 text-xs text-neutral-600"
      onSubmit={(e) => {
        e.preventDefault();
        if (locked || !dates.length || invalid) return;
        onPlace(range.date, range.startMinute, lengthOf(range));
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
            <DateTimeRange
              value={range}
              minDate={dates[0]}
              maxDate={dates.at(-1)!}
              disabled={locked}
              invalid={invalid}
              onChange={setRange}
            />
          </div>
        ) : (
          <p className="text-neutral-500">Set trip dates to schedule visits.</p>
        )}
        <button
          type="submit"
          className={calendarButton}
          disabled={locked || !dates.length || invalid}
        >
          {visit ? "Update visit" : "Schedule visit"}
        </button>
        {visit && (
          <>
            <button
              type="button"
              className={calendarButton}
              disabled={disabled}
              onClick={onReserve}
            >
              {visit.locked ? "Unreserve" : "Reserve"}
            </button>
            <button
              type="button"
              className={calendarButton}
              disabled={disabled}
              onClick={onRemove}
            >
              Remove visit
            </button>
          </>
        )}
      </div>
    </form>
  );
}
