import { Drawer } from "@base-ui/react/drawer";
import { StopsList } from "@/components/trips-drawer/stops-list";
import { useUserStore } from "@/providers/user-store-provider";
import { TripSelector } from "@/components/trips-drawer/trip-selector";
import { Button, Separator } from "@base-ui/react";
import { MapNavigation } from "@/components/trips-drawer/types";
import { MapSaveIcon } from "@/components/ui/icons/map-icons";
import { useTripStore } from "@/providers/trip-store-provider";
import { useShallow } from "zustand/react/shallow";
import { Menu } from "@base-ui/react/menu";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { XIcon } from "@/components/ui/icons/close-icons";
import { ResetIcon } from "@/components/ui/icons/reset-icons";
import { Spinner } from "@/components/ui/icons/spinner";
import { useTripDirty } from "@/hooks/use-trip-dirty";
import { PencilPinIcon } from "@/components/ui/icons/pin-icons";
import { useState } from "react";

export const TripContent = ({ map }: MapNavigation) => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
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

  const serverTrip = currentTrip?.publicId
    ? trips.find((trip) => trip.publicId === currentTrip.publicId)
    : undefined;

  const isDirty = useTripDirty(currentTrip, serverTrip);

  const showActions = !!userInfo && (isEditingTrip || isDirty);

  const isSaving = tripSaveStatus === "saving";

  const onSaveHandler = () => {
    if (currentTrip) void syncTrips(currentTrip);
    setIsEditingTrip(false);
  };

  const onResetHandler = () => {
    resetDraft();
    setIsEditingTrip(false);
  };

  return (
    <div className={"flex min-h-0 w-full flex-auto flex-col"}>
      <div className={"shrink-0 p-4"}>
        <Drawer.Title className={"flex flex-row justify-between gap-4"}>
          {userInfo ? (
            <TripSelector />
          ) : (
            <p
              className={
                "flex w-full cursor-pointer rounded-2xl bg-blue-500 px-4 py-2 text-2xl font-bold tracking-widest text-white"
              }
            >
              My Trip
            </p>
          )}

          <div className="group flex flex-row justify-end">
            <TripDrawerMenu onEdit={() => setIsEditingTrip(true)} />
          </div>
        </Drawer.Title>
      </div>

      <Separator className={"h-px bg-gray-200"} />

      <div className={"flex min-h-0 flex-auto flex-col font-medium"}>
        <StopsList map={map} />
      </div>

      <div className={"mt-auto shrink-0 font-medium"}>
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

export const TripDrawerMenu = ({ onEdit }: { onEdit: () => void }) => {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Trip menu"
        className="flex cursor-pointer rounded-2xl bg-blue-500 p-2 text-xl font-bold tracking-widest text-white hover:bg-blue-600"
      >
        <HamburgerMenuIcon aria-hidden="true" className="h-6 w-6" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="end"
          sideOffset={8}
          className={"z-50 outline-hidden"}
        >
          <Menu.Popup
            className={
              "flex origin-[var(--transform-origin)] flex-col rounded-lg border border-gray-200 bg-white p-2 text-black shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] outline-hidden transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-100 data-ending-style:opacity-100 data-starting-style:scale-100 data-starting-style:opacity-0"
            }
          >
            <MenuItem onClick={onEdit}>
              <PencilPinIcon
                aria-hidden="true"
                className="h-6 w-6 fill-current"
              />
              Edit Trip
            </MenuItem>

            <MenuItem nativeButton render={<Drawer.Close />}>
              <XIcon aria-hidden="true" className="h-6 w-6 stroke-current" />
              Close
            </MenuItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

const MenuItem = (props: Menu.Item.Props) => (
  <Menu.Item
    className={
      "group flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm leading-4 text-black outline-hidden select-none data-disabled:cursor-default data-disabled:text-neutral-500 data-highlighted:bg-blue-500 data-highlighted:text-white"
    }
    {...props}
  />
);