import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@base-ui/react/button";
import { cn } from "cn";
import { dangerButton, outlineButton } from "@/components/ui/button-styles";
import { Spinner } from "@/components/ui/icons/spinner";
import { popupMotion, popupSurface } from "@/components/ui/popup-styles";

/** Asks before deleting the trip, since there is no undo. */
export const DeleteTripDialog = ({
  name,
  open,
  busy,
  onOpenChange,
  onConfirm,
}: {
  name: string;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) => (
  // TODO: show the delete error in the dialog (store keeps it in `save`).
  <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-neutral-950/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
      <AlertDialog.Popup
        className={cn(
          popupSurface,
          popupMotion,
          "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-1/2 rounded-3xl p-6",
        )}
      >
        <AlertDialog.Title className="text-lg font-bold">
          Delete {name}?
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-sm text-neutral-500">
          This removes the trip and all its stops. You can&apos;t undo this.
        </AlertDialog.Description>
        <div className="mt-6 flex gap-3">
          <AlertDialog.Close
            disabled={busy}
            className={cn(outlineButton, "flex-1")}
          >
            Cancel
          </AlertDialog.Close>
          <Button
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
            className={cn(dangerButton, "flex-1")}
          >
            {busy && <Spinner className="size-5 animate-spin fill-current" />}
            Delete
          </Button>
        </div>
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  </AlertDialog.Root>
);
