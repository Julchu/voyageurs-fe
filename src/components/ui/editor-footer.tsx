import { Button } from "@base-ui/react/button";
import { cn } from "cn";
import { CheckIcon } from "@/components/ui/icons/planner-icons";
import { ResetIcon } from "@/components/ui/icons/reset-icons";
import { Spinner } from "@/components/ui/icons/spinner";
import { pill } from "./button-styles";

type Props = {
  isDirty: boolean;
  isEditing?: boolean;
  isSaving: boolean;
  canSave: boolean;
  resetLabel?: string;
  saveLabel?: string;
  onSave: () => void;
  onReset: () => void;
};

export function EditorFooter({
  isDirty,
  isEditing = false,
  isSaving,
  canSave,
  resetLabel = "Reset",
  saveLabel = "Save",
  onSave,
  onReset,
}: Props) {
  if (!isDirty && !isEditing && !isSaving) return null;

  return (
    <footer
      className="mt-auto flex shrink-0 gap-4 border-t border-neutral-100 bg-white p-4"
      aria-label="Editor actions"
    >
      <Button
        onClick={onReset}
        disabled={isSaving}
        className={cn(
          pill,
          "flex-1 border border-neutral-200 bg-transparent text-neutral-800 hover:border-red-500 hover:bg-red-500 hover:text-white disabled:hover:border-neutral-200 disabled:hover:bg-transparent disabled:hover:text-neutral-800",
        )}
      >
        <ResetIcon aria-hidden="true" className="size-5 stroke-current" />
        {resetLabel}
      </Button>
      <Button
        onClick={onSave}
        disabled={!isDirty || isSaving || !canSave}
        aria-busy={isSaving}
        className={cn(
          pill,
          "flex-1 bg-blue-500/80 text-white shadow-lg shadow-blue-500/30 hover:bg-green-500 hover:shadow-green-500/30 disabled:shadow-none disabled:hover:bg-blue-500/80",
        )}
      >
        {isSaving ? (
          <Spinner className="size-5 animate-spin fill-white" />
        ) : (
          <CheckIcon aria-hidden="true" className="size-5" />
        )}
        {saveLabel}
      </Button>
    </footer>
  );
}
