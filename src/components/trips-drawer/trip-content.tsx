import { Drawer } from "@base-ui/react/drawer";
import { Input } from "@base-ui/react/input";
import { Menu } from "@base-ui/react/menu";
import { Separator } from "@base-ui/react/separator";
import { useState } from "react";
import { cn } from "cn";
import { StopsList } from "@/components/trips-drawer/stops-list";
import { TripSelector } from "@/components/trips-drawer/trip-selector";
import { EditorFooter } from "@/components/ui/editor-footer";
import { XIcon } from "@/components/ui/icons/close-icons";
import { PencilPinIcon, PinMenuButton } from "@/components/ui/icons/pin-icons";
import { MenuItem } from "@/components/ui/menu-item";
import { popupMotion, popupSurface } from "@/components/ui/popup-styles";
import { useTripDraft } from "@/hooks/use-trip-draft";
import { useTripStore } from "@/providers/trip-store-provider";
import { useUserStore } from "@/providers/user-store-provider";

export const TripContent = () => {
  const signedIn = useUserStore(({ userInfo }) => !!userInfo);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const renameTrip = useTripStore(({ renameTrip }) => renameTrip);
  const { trip, isDirty, isSaving, canSave, save, reset } = useTripDraft();

  const showNameInput = !signedIn || !trip.publicId || isEditingTrip;
  const title = trip.name.trim() || "My Trip";

  const onSave = async () => {
    // A failed save keeps the editor open so the name can be fixed.
    if (await save()) setIsEditingTrip(false);
  };

  const onReset = () => {
    reset();
    setIsEditingTrip(false);
  };

  return (
    <div className="flex min-h-0 w-full flex-auto flex-col">
      <div className="flex shrink-0 flex-row justify-between gap-4 p-4">
        {signedIn ? (
          <>
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            <TripSelector />
          </>
        ) : (
          <Drawer.Title className="flex w-full rounded-2xl bg-blue-500 px-4 py-2 text-2xl font-bold tracking-widest text-white">
            {title}
          </Drawer.Title>
        )}
        <TripDrawerMenu onEdit={() => setIsEditingTrip(true)} />
      </div>

      {showNameInput ? (
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
      ) : null}

      <Separator className="h-px bg-gray-200" />

      <div className="flex min-h-0 flex-auto flex-col p-4 font-medium">
        <StopsList />
      </div>

      <EditorFooter
        isDirty={isDirty}
        isEditing={isEditingTrip}
        isSaving={isSaving}
        canSave={canSave}
        resetLabel="Restore"
        onSave={onSave}
        onReset={onReset}
      />
    </div>
  );
};

const TripDrawerMenu = ({ onEdit }: { onEdit: () => void }) => (
  <Menu.Root>
    <Menu.Trigger
      aria-label="Trip menu"
      openOnHover
      className="group flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-blue-500 text-xl font-bold tracking-widest text-white transition-colors duration-150 hover:bg-green-500 data-popup-open:bg-green-500 motion-reduce:transition-none"
    >
      <PinMenuButton
        aria-hidden="true"
        className="h-6 w-6 fill-none stroke-white"
      />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner
        align="end"
        sideOffset={8}
        className="z-50 outline-hidden"
      >
        <Menu.Popup
          className={cn(
            popupSurface,
            popupMotion,
            "flex flex-col rounded-lg p-2",
          )}
        >
          <MenuItem onClick={onEdit}>
            <PencilPinIcon
              aria-hidden="true"
              className="h-6 w-6 fill-blue-500 group-hover:fill-white"
            />
            Edit Trip
          </MenuItem>

          <MenuItem nativeButton render={<Drawer.Close />}>
            <XIcon
              aria-hidden="true"
              className="h-6 w-6 stroke-red-500 group-hover:stroke-white"
            />
            Close
          </MenuItem>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
);
