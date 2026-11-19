import { useState } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { Input } from "@base-ui/react/input";
import { Menu } from "@base-ui/react/menu";
import { Separator } from "@base-ui/react/separator";
import { useShallow } from "zustand/react/shallow";
import { useTripStore } from "@/providers/trip-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { selectIsSaving, selectTripDirty } from "@/stores/trip-store";
import { EditorFooter } from "@/components/ui/editor-footer";
import { MenuItem, MenuPopup } from "@/components/ui/menu";
import { XIcon } from "@/components/ui/icons/close-icons";
import { PencilPinIcon, PinMenuButton } from "@/components/ui/icons/pin-icons";
import type { MapNavigation } from "./types";
import { StopsList } from "./stops-list";
import { TripSelector } from "./trip-selector";

export const TripContent = ({ map }: MapNavigation) => {
  const isSignedIn = useUserStore(({ userInfo }) => !!userInfo);
  const { trip, isSaving, isDirty, renameTrip, resetTrip, saveTrip } =
    useTripStore(
      useShallow((state) => ({
        trip: state.currentTrip,
        isSaving: selectIsSaving(state),
        isDirty: selectTripDirty(state),
        renameTrip: state.renameTrip,
        resetTrip: state.resetTrip,
        saveTrip: state.saveTrip,
      })),
    );
  const [isEditing, setIsEditing] = useState(false);

  // Invalid names stay editable so they can be fixed.
  const save = async () => {
    if (await saveTrip()) setIsEditing(false);
  };
  const reset = () => {
    resetTrip();
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-0 w-full flex-auto flex-col">
      <div className="flex shrink-0 flex-row gap-2 p-4">
        <Drawer.Title className="flex w-full flex-row justify-between gap-4">
          {isSignedIn ? (
            <TripSelector />
          ) : (
            <p className="flex w-full rounded-2xl bg-blue-500 px-4 py-2 text-2xl font-bold tracking-widest text-white">
              {trip.name.trim() || "My Trip"}
            </p>
          )}
          <TripMenu onEdit={() => setIsEditing(true)} />
        </Drawer.Title>
      </div>

      {(!isSignedIn || !trip.publicId || isEditing) && (
        <div className="px-4 pb-4">
          <Input
            type="text"
            placeholder="Name your trip"
            aria-label="Trip name"
            value={trip.name}
            onValueChange={renameTrip}
            maxLength={255}
            disabled={isSaving}
            className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-neutral-950 outline-none"
          />
        </div>
      )}

      <Separator className="h-px bg-gray-200" />

      <div className="flex min-h-0 flex-auto flex-col p-4 font-medium">
        <StopsList map={map} />
      </div>

      {isSignedIn && (
        <EditorFooter
          isDirty={isDirty || isEditing}
          isSaving={isSaving}
          canSave
          resetLabel="Restore"
          onSave={() => void save()}
          onReset={reset}
        />
      )}
    </div>
  );
};

const TripMenu = ({ onEdit }: { onEdit: () => void }) => (
  <Menu.Root>
    <Menu.Trigger
      aria-label="Trip menu"
      openOnHover
      className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-blue-500 transition-colors duration-150 hover:bg-green-500 data-popup-open:bg-green-500 motion-reduce:transition-none"
    >
      <PinMenuButton
        aria-hidden="true"
        className="size-6 fill-none stroke-white"
      />
    </Menu.Trigger>
    <MenuPopup>
      <MenuItem onClick={onEdit}>
        <PencilPinIcon
          aria-hidden="true"
          className="size-6 fill-blue-500 group-data-highlighted:fill-white"
        />
        Edit Trip
      </MenuItem>
      <MenuItem nativeButton render={<Drawer.Close />}>
        <XIcon
          aria-hidden="true"
          className="size-6 stroke-red-500 group-data-highlighted:stroke-white"
        />
        Close
      </MenuItem>
    </MenuPopup>
  </Menu.Root>
);
