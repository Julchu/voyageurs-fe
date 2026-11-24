import { Button } from "@base-ui/react/button";
import { cn } from "cn";
import { badge, outlineButton } from "@/components/ui/button-styles";
import {
  ArrowLeftIcon,
  InfoIcon,
  PinIcon,
} from "@/components/ui/icons/planner-icons";
import { useTripStore } from "@/providers/trip-store-provider";
import type { TripStopDraft } from "@/types/trip-draft";
import { stopId } from "@/utils/trip-stop";
import { AvailabilityGrid } from "./availability-grid";

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
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-3 border-b border-neutral-100 px-4 py-3 md:px-6 md:py-4">
        <Button type="button" className={outlineButton} onClick={onBack}>
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Calendar
        </Button>
        <h2 className="order-3 w-full text-2xl font-bold md:order-none md:w-auto">
          Open hours
        </h2>
        {/* Shrinks instead of wrapping onto its own line. */}
        <span
          className={cn(
            badge,
            "max-w-fit flex-1 basis-0 md:flex-none md:basis-auto",
          )}
        >
          <PinIcon aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{stop.name}</span>
        </span>
        <div className="order-4 flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500 md:order-none md:ml-auto md:w-auto">
          <p className="flex items-center gap-2">
            <InfoIcon aria-hidden="true" className="size-4 shrink-0" />
            <span>Drag on the grid to add · No hours = open anytime</span>
          </p>
          {stop.availability.length > 0 && (
            <Button
              type="button"
              disabled={disabled}
              className="cursor-pointer font-medium text-red-600 hover:underline disabled:opacity-50"
              onClick={() => setOpenHours(id, [])}
            >
              Clear all
            </Button>
          )}
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
