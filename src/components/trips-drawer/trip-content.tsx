import { Drawer } from "@base-ui/react/drawer";
import { Input } from "@base-ui/react/input";
import { Menu } from "@base-ui/react/menu";
import { Separator } from "@base-ui/react/separator";
import { useState } from "react";
import { cn } from "cn";
import { DeleteTripDialog } from "@/components/trips-drawer/delete-trip-dialog";
import { StopsList } from "@/components/trips-drawer/stops-list";
import { TripSelector } from "@/components/trips-drawer/trip-selector";
import { EditorFooter } from "@/components/ui/editor-footer";
import { XIcon } from "@/components/ui/icons/close-icons";
import { MapDeleteIcon } from "@/components/ui/icons/map-icons";
import { PencilPinIcon, PinMenuButton } from "@/components/ui/icons/pin-icons";
import { MenuItem } from "@/components/ui/menu-item";
import { popupMotion, popupSurface } from "@/components/ui/popup-styles";
import { useTripDraft } from "@/hooks/use-trip-draft";
import { useTripStore } from "@/providers/trip-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import type { TripDraft } from "@/types/trip-draft";
import { stopCountLabel } from "@/utils/trip-stop";
import { dateLabel } from "@/utils/trip-time";

/** "Nov 18 – Nov 28 · 8 stops", or just the stop count before dates are set. */
const tripSummary = ({ startDate, endDate, stops }: TripDraft) => {
  const count = stopCountLabel(stops.length);
  return startDate && endDate
    ? `${dateLabel(startDate, false)} – ${dateLabel(endDate, false)} · ${count}`
    : count;
};

export const TripContent = () => {
  const signedIn = useUserStore(({ userInfo }) => !!userInfo);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const renameTrip = useTripStore(({ renameTrip }) => renameTrip);
  const deleteTrip = useTripStore(({ deleteTrip }) => deleteTrip);
  const { trip, isDirty, isSaving, canSave, save, reset } = useTripDraft();

  const editing = !signedIn || !trip.publicId || isEditingTrip;
  const title = trip.name.trim() || "My Trip";

  const onSave = async () => {
    // A failed save keeps the editor open so the name can be fixed.
    if (await save()) setIsEditingTrip(false);
  };

  const onReset = () => {
    reset();
    setIsEditingTrip(false);
  };

  // A failed delete keeps the dialog open to retry.
  const onDelete = async () => {
    if (!(await deleteTrip())) return;
    setIsConfirmingDelete(false);
    setIsEditingTrip(false);
  };

  return (
    <div className="flex min-h-0 w-full flex-auto flex-col">
      <div className="flex shrink-0 items-center gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          {signedIn ? (
            <>
              <Drawer.Title className="sr-only">{title}</Drawer.Title>
              <TripSelector />
            </>
          ) : (
            <Drawer.Title className="truncate text-xl font-bold sm:text-2xl">
              {title}
            </Drawer.Title>
          )}
          <Drawer.Description className="mt-0.5 text-sm font-medium text-neutral-500">
            {tripSummary(trip)}
          </Drawer.Description>
        </div>
        <TripDrawerMenu
          onEdit={() => setIsEditingTrip(true)}
          onDelete={
            trip.publicId ? () => setIsConfirmingDelete(true) : undefined
          }
        />
        <DeleteTripDialog
          name={title}
          open={isConfirmingDelete}
          busy={isSaving}
          onOpenChange={setIsConfirmingDelete}
          onConfirm={onDelete}
        />
      </div>

      {editing ? (
        <div className="px-5 pb-4">
          <Input
            type="text"
            placeholder="Name your trip"
            aria-label="Trip name"
            value={trip.name}
            onValueChange={renameTrip}
            maxLength={255}
            disabled={isSaving}
            className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-neutral-950 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      ) : null}

      <Separator className="h-px bg-neutral-100" />

      <div className="flex min-h-0 flex-auto flex-col px-3 pt-2 pb-4">
        <StopsList editing={editing} />
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

/** Delete only shows for saved trips; Restore already discards an unsaved one. */
const TripDrawerMenu = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete?: () => void;
}) => (
  <Menu.Root>
    <Menu.Trigger
      aria-label="Trip menu"
      openOnHover
      className="group flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-blue-500 text-xl font-bold tracking-widest text-white transition-colors duration-150 hover:bg-green-500 data-popup-open:bg-green-500 motion-reduce:transition-none"
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
            "flex flex-col rounded-2xl p-2",
          )}
        >
          <MenuItem onClick={onEdit}>
            <PencilPinIcon
              aria-hidden="true"
              className="h-6 w-6 fill-blue-500 group-data-highlighted:fill-white"
            />
            Edit
          </MenuItem>

          {onDelete && (
            <MenuItem onClick={onDelete}>
              <MapDeleteIcon
                aria-hidden="true"
                className="h-6 w-6 fill-none stroke-red-500 group-data-highlighted:stroke-white"
              />
              Delete
            </MenuItem>
          )}

          <MenuItem nativeButton render={<Drawer.Close />}>
            <XIcon
              aria-hidden="true"
              className="h-6 w-6 stroke-red-500 group-data-highlighted:stroke-white"
            />
            Close
          </MenuItem>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
);
