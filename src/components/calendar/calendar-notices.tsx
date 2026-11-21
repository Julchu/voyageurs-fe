import { Button } from "@base-ui/react/button";
import type { TimeSlot } from "@/types/trip-api";
import { timeLabel } from "@/utils/trip-calendar";

export function NoDatesState() {
  return (
    <div className="flex min-h-48 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <div
        className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-500"
        aria-hidden="true"
      >
        📅
      </div>
      <h2 className="text-sm font-medium">Give your trip a little time.</h2>
      <p className="max-w-sm text-xs leading-relaxed text-neutral-500">
        Choose a start and end date to begin planning. You can edit each stop’s
        weekly open hours anytime.
      </p>
    </div>
  );
}

export function OutsideDatesNotice({
  slots,
  nameOf,
  disabled,
  onRemove,
}: {
  slots: TimeSlot[];
  nameOf: (stopId: string) => string;
  disabled: boolean;
  onRemove: (slot: TimeSlot) => void;
}) {
  return (
    <div className="max-h-32 shrink-0 overflow-auto overscroll-none border-t border-amber-100 bg-amber-50 px-4 py-3">
      <p className="mb-2 text-xs text-amber-800">
        Time slots outside the selected dates
      </p>
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="flex items-center justify-between gap-2 py-1 text-xs text-amber-900"
        >
          <span>
            {nameOf(slot.stopId)} · {slot.date} · {timeLabel(slot.startMinute)}
          </span>
          <Button
            type="button"
            className="underline"
            disabled={disabled}
            onClick={() => onRemove(slot)}
          >
            Remove time slot
          </Button>
        </div>
      ))}
    </div>
  );
}
