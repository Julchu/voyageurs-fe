import { Button } from "@base-ui/react/button";
import { MapSaveIcon } from "@/components/ui/icons/map-icons";
import { ResetIcon } from "@/components/ui/icons/reset-icons";
import { Spinner } from "@/components/ui/icons/spinner";

type Props = {
  isDirty: boolean;
  isEditing?: boolean;
  isSaving: boolean;
  canSave: boolean;
  resetLabel?: string;
  onSave: () => void;
  onReset: () => void;
};

export function EditorFooter({
  isDirty,
  isEditing = false,
  isSaving,
  canSave,
  resetLabel = "Reset",
  onSave,
  onReset,
}: Props) {
  if (!isDirty && !isEditing && !isSaving) return null;

  return (
    <footer
      className="mt-auto shrink-0 border-t border-gray-200 bg-white font-medium"
      aria-label="Editor actions"
    >
      <div className="flex justify-end gap-4 p-4">
        <Button
          onClick={onReset}
          disabled={isSaving}
          className="group flex h-10 w-full cursor-pointer items-center justify-center gap-x-2 rounded-md border border-gray-200 px-4 font-medium tracking-widest transition-colors duration-150 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        >
          <ResetIcon
            aria-hidden="true"
            className="h-6 w-6 stroke-black group-hover:stroke-white"
          />
          {resetLabel}
        </Button>
        <Button
          onClick={onSave}
          disabled={!isDirty || isSaving || !canSave}
          aria-busy={isSaving}
          className="group flex h-10 w-full cursor-pointer items-center justify-center gap-x-2 rounded-md border border-gray-200 bg-blue-500 px-4 font-medium tracking-widest text-white transition-colors duration-150 hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        >
          {isSaving ? (
            <Spinner className="h-6 w-6 animate-spin fill-white" />
          ) : (
            <MapSaveIcon
              aria-hidden="true"
              className="h-6 w-6 fill-none stroke-white"
            />
          )}
          Save
        </Button>
      </div>
    </footer>
  );
}
