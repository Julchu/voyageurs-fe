import { useTripStore } from "@/providers/trip-store-provider";
import { useShallow } from "zustand/react/shallow";
import { Button, Separator } from "@base-ui/react";
import { ResetIcon } from "@/components/ui/icons/reset-icons";
import { MapSaveIcon } from "@/components/ui/icons/map-icons";
import { DragEndEvent } from "@dnd-kit/dom";
import { useState } from "react";
import type { Coordinates } from "@/utils/interfaces";
import { isSortable } from "@dnd-kit/react/sortable";
import { DragDropProvider } from "@dnd-kit/react";
import { DraggableTripStops } from "@/components/trips-drawer/draggable-trip-stops";
import { useTripDirty } from "@/hooks/use-trip-dirty";
import { Spinner } from "@/components/ui/icons/spinner";
import { useUserStore } from "@/providers/user-store-provider";
import { useMapHook } from "@/hooks/use-map-hook";
import { MapNavigation } from "@/components/trips-drawer/types";

export const TripForm = ({ map }: MapNavigation) => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  const {
    trips,
    currentTrip,
    resetDraft,
    syncTrips,
    tripSaveStatus,
    tripSaveError,
    savedTripVersion,
    tripVersion,
  } = useTripStore(
    useShallow(
      ({
        trips,
        currentTrip,
        resetDraft,
        syncTrips,
        tripSaveStatus,
        tripSaveError,
        savedTripVersion,
        tripVersion,
      }) => ({
        trips,
        currentTrip,
        resetDraft,
        syncTrips,
        tripSaveStatus,
        tripSaveError,
        savedTripVersion,
        tripVersion,
      }),
    ),
  );

  const [isEditingTrip, setIsEditingTrip] = useState<boolean>(false);

  const serverTrip = currentTrip?.publicId
    ? trips.find((trip) => trip.publicId === currentTrip.publicId)
    : undefined;

  const isDirty = useTripDirty(currentTrip, serverTrip);

  const showActions = !!userInfo && (isEditingTrip || isDirty);

  const isSaving = tripSaveStatus === "saving";

  // TODO: saving new trip should set that trip as current trip
  const onSaveHandler = () => {
    if (currentTrip) void syncTrips(currentTrip);
    setIsEditingTrip(false);
  };

  const onResetHandler = () => {
    resetDraft();
    setIsEditingTrip(false);
    return;
  };

  return (
    <div className={"flex min-h-0 flex-auto flex-col font-medium"}>
      {currentTrip ? (
        <div className="flex min-h-0 flex-auto flex-col">
          <div className={"shrink-0 px-4"}>
            {currentTrip.stops.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Search an address or tap a place on the map, then add it to this
                trip.
              </p>
            ) : null}
          </div>

          {/* Trip list */}
          <div
            className={
              "min-h-0 flex-auto touch-auto overflow-y-auto overscroll-contain"
            }
          >
            <StopsList map={map} />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">No current trip yet.</p>
      )}

      <div className={"mt-auto shrink-0"}>
        <Separator className={"h-px bg-gray-200"} />
        {tripSaveStatus === "error" ? (
          <p role="alert" className="px-4 pt-3 text-sm text-red-600">
            {tripSaveError}
          </p>
        ) : null}
        <p
          role="status"
          aria-live="polite"
          className="px-4 text-sm text-neutral-500"
        >
          {isSaving
            ? "Saving trip…"
            : tripSaveStatus === "saved" && savedTripVersion === tripVersion
              ? "Trip saved."
              : ""}
        </p>

        {/* Reset/save trip button row */}
        {showActions ? (
          <div className="flex justify-end gap-4 p-4">
            <Button
              onClick={onResetHandler}
              disabled={isSaving || !currentTrip}
              className="group flex h-10 w-full cursor-pointer items-center justify-center gap-x-2 rounded-md border border-gray-200 px-4 font-medium tracking-widest hover:bg-red-500 hover:text-white"
            >
              <ResetIcon
                className={"h-6 w-6 stroke-black group-hover:stroke-white"}
              />
              Restore
            </Button>

            {/* Save trip button */}
            <Button
              onClick={onSaveHandler}
              disabled={isSaving || !currentTrip}
              aria-busy={isSaving}
              className="group flex h-10 w-full cursor-pointer items-center justify-center gap-x-2 rounded-md border border-gray-200 bg-blue-500 px-4 font-medium tracking-widest text-white hover:bg-green-500"
            >
              {isSaving ? (
                <Spinner className={"h-6 w-6 animate-spin fill-white"} />
              ) : (
                <MapSaveIcon className={"h-6 w-6 fill-white"} />
              )}
              Save
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const StopsList = ({ map }: MapNavigation) => {
  const { currentTrip, reorderStops } = useTripStore(
    useShallow(({ currentTrip, reorderStops }) => ({
      currentTrip,
      reorderStops,
    })),
  );

  const [{ flyTo }] = useMapHook({ map });

  const onClickHandler = (coordinates: Coordinates) => {
    flyTo({
      lat: coordinates.lat,
      lng: coordinates.lng,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) return;
    const { source } = event.operation;
    if (!source || !isSortable(source)) return;
    const from = source.initialIndex;
    const to = source.index;
    if (from === to) return;
    reorderStops(from, to);
  };

  if (!currentTrip) return null;
  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <ol className="flex flex-col gap-2 overflow-x-hidden p-4">
        {currentTrip.stops.map((stop, index) => {
          const id = String(stop.clientId ?? stop.publicId ?? index);

          return (
            <DraggableTripStops
              id={id}
              index={index}
              key={id}
              stop={stop}
              onClickHandler={onClickHandler}
            />
          );
        })}
      </ol>
    </DragDropProvider>
  );
};