import { Button } from "@base-ui/react/button";
import { useTripStore } from "@/providers/trip-store-provider";
import type { TripStopDraft } from "@/types/trip-draft";
import { stopId } from "@/utils/trip-stop";
import { AvailabilityGrid } from "./availability-grid";
import { calendarButton } from "./styles";

/** Weekly open hours for one stop's place. */
export function OpenHoursEditor({
  stop,
  disabled,
  onBack,
}: {
  stop: TripStopDraft;
  disabled: boolean;
  onBack: () => void;
}) {
  const setOpenHours = useTripStore((state) => state.setOpenHours);
  const id = stopId(stop);
  return (
    <>
      <div className="shrink-0 space-y-3 border-b border-neutral-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium tracking-wide text-blue-600 uppercase">
              Weekly open hours
            </p>
            <h2 className="mt-1 text-sm font-semibold">{stop.name}</h2>
          </div>
          <Button type="button" className={calendarButton} onClick={onBack}>
            Back to trip calendar
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-xl text-xs leading-relaxed text-neutral-500">
            Select a continuous time range to mark it open. Drag or resize a
            block across days to change it. With no open hours, this stop is
            available anytime. Times are local trip time.
          </p>
          <Button
            type="button"
            disabled={disabled || !stop.availability.length}
            className={calendarButton}
            onClick={() => setOpenHours(id, [])}
          >
            Clear open hours
          </Button>
        </div>
      </div>
      <AvailabilityGrid
        key={id}
        windows={stop.availability}
        disabled={disabled}
        onChange={(windows) => setOpenHours(id, windows)}
      />
    </>
  );
}
