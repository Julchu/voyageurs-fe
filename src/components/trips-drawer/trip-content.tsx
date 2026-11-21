import { Drawer } from "@base-ui/react/drawer";
import { StopsList } from "@/components/trips-drawer/stops-list";
import { useUserStore } from "@/providers/user-store-provider";
import { TripSelector } from "@/components/trips-drawer/trip-selector";
import { Input } from "@base-ui/react/input";
import { Separator } from "@base-ui/react/separator";
import { EditorFooter } from "@/components/ui/editor-footer";
import { MapNavigation } from "@/components/trips-drawer/types";
import { useTripStore } from "@/providers/trip-store-provider";
import { Menu } from "@base-ui/react/menu";
import { XIcon } from "@/components/ui/icons/close-icons";
import { useTripDraft } from "@/hooks/use-trip-draft";
import { PencilPinIcon, PinMenuButton } from "@/components/ui/icons/pin-icons";
import { useState } from "react";

export const TripContent = ({ map }: MapNavigation) => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const renameTrip = useTripStore(({ renameTrip }) => renameTrip);
  const {
    trip: currentTrip,
    isDirty,
    isSaving,
    canSave,
    save,
    reset,
  } = useTripDraft();

  const showNameInput =
    !!currentTrip && (!userInfo || !currentTrip.publicId || isEditingTrip);

  const onSaveHandler = () => {
    void save();
    // Keep an empty name visible so it can be fixed.
    if (currentTrip?.name.trim()) setIsEditingTrip(false);
  };

  const onResetHandler = () => {
    reset();
    setIsEditingTrip(false);
  };

  return (
    <div className={"flex min-h-0 w-full flex-auto flex-col"}>
      <div className={"flex shrink-0 flex-row gap-2 p-4"}>
        <Drawer.Title className={"flex w-full flex-row justify-between gap-4"}>
          {userInfo ? (
            <TripSelector />
          ) : (
            <p
              className={
                "flex w-full cursor-pointer rounded-2xl bg-blue-500 px-4 py-2 text-2xl font-bold tracking-widest text-white"
              }
            >
              {currentTrip?.name.trim() || "My Trip"}
            </p>
          )}

          <div className="group flex flex-row justify-end">
            <TripDrawerMenu onEdit={() => setIsEditingTrip(true)} />
          </div>
        </Drawer.Title>
      </div>

      {showNameInput && currentTrip ? (
        <div className="px-4 pb-4">
          <Input
            type="text"
            placeholder="Name your trip"
            aria-label="Trip name"
            value={currentTrip.name}
            onValueChange={renameTrip}
            maxLength={255}
            disabled={isSaving}
            className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-neutral-950 outline-none"
          />
        </div>
      ) : null}

      <Separator className={"h-px bg-gray-200"} />

      <div className={"flex min-h-0 flex-auto flex-col p-4 font-medium"}>
        <StopsList map={map} />
      </div>

      <EditorFooter
        isDirty={isDirty}
        isEditing={isEditingTrip}
        isSaving={isSaving}
        canSave={canSave}
        resetLabel="Restore"
        onSave={onSaveHandler}
        onReset={onResetHandler}
      />
    </div>
  );
};

export const TripDrawerMenu = ({ onEdit }: { onEdit: () => void }) => {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Trip menu"
        openOnHover
        className="group flex size-11 cursor-pointer items-center justify-center rounded-xl bg-blue-500 text-xl font-bold tracking-widest text-white transition-colors duration-150 hover:bg-green-500 data-popup-open:bg-green-500 motion-reduce:transition-none"
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
          className={"z-50 outline-hidden"}
        >
          <Menu.Popup
            className={
              "flex origin-[var(--transform-origin)] flex-col rounded-lg bg-white p-2 text-black shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] outline-hidden transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none"
            }
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
};

const MenuItem = (props: Menu.Item.Props) => (
  <Menu.Item
    className={
      "group flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm leading-4 text-black outline-hidden transition-colors duration-150 select-none data-disabled:cursor-default data-disabled:text-neutral-500 data-highlighted:bg-blue-500 data-highlighted:text-white motion-reduce:transition-none"
    }
    {...props}
  />
);
