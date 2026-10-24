"use client";

import { ComponentProps, useId, useMemo, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { useShallow } from "zustand/react/shallow";
import { useTripStore } from "@/providers/trip-store-provider";

/**
 * A single option in the trip dropdown.
 *
 * Using the `{ value, label }` shape lets Base UI derive the display text and
 * selection value automatically. `create`/`rename` are only present on the
 * synthetic action rows, letting the value handler tell apart "picked an
 * existing trip" from "create a new trip" or "rename the current trip".
 */
type TripOption = {
  /**
   * Identity used by the combobox: `publicId` for saved trips, `clientId` for
   * an unsaved draft, or one of the action constants for a synthetic row.
   */
  value: string;
  /** Text shown in the input and list. */
  label: string;
  /** Raw name to create. Only set on the synthetic create row. */
  create?: string;
  /** Raw name to rename the current trip to. Only set on the synthetic rename row. */
  rename?: string;
};

// The action rows represent operations rather than existing trips, so they use
// fixed sentinel values (only one of each is ever shown at a time).
const CREATE_OPTION_VALUE = "__create_trip__";
const RENAME_OPTION_VALUE = "__rename_trip__";

export const TripCombobox = () => {
  const inputId = useId();
  const { trips, currentTrip, selectTrip, createTrip, renameTrip } =
    useTripStore(
      useShallow(
        ({ trips, currentTrip, selectTrip, createTrip, renameTrip }) => ({
          trips,
          currentTrip,
          selectTrip,
          createTrip,
          renameTrip,
        }),
      ),
    );

  // Controlled input. Passing `inputValue` sets Base UI's `hasInputValue`, which
  // disables its auto-revert-to-selection sync. Without this, emptying the field
  // in one step (⌘A+⌫ or ⌘⌫) snaps back to the trip name, because Base UI only
  // keeps a cleared input when a non-empty value was typed first.
  const [query, setQuery] = useState(() => currentTrip?.name ?? "");

  // Reset the text when the current trip changes from outside the combobox
  // (e.g. Restore). Editing never changes currentTrip.name, so typing is safe.
  // React's render-time reset pattern avoids an effect + extra commit.
  const [lastSyncedName, setLastSyncedName] = useState(currentTrip?.name);
  if (currentTrip?.name !== lastSyncedName) {
    setLastSyncedName(currentTrip?.name);
    setQuery(currentTrip?.name ?? "");
  }

  // Only saved trips (those with a `publicId`) can be selected from the list.
  const options = useMemo<TripOption[]>(
    () =>
      trips.flatMap((trip) =>
        trip.publicId ? [{ value: trip.publicId, label: trip.name }] : [],
      ),
    [trips],
  );

  // Mirror the current trip into the controlled selection so the input reflects
  // it and stays in sync when the trip changes elsewhere (reset, rename, etc.).
  // Kept non-undefined (`null` when empty) so the prop never flips to
  // uncontrolled.
  const selectedOption = useMemo<TripOption | null>(() => {
    if (!currentTrip) return null;
    // Drafts always carry a clientId, so this resolves to a stable id.
    const value = currentTrip.publicId ?? currentTrip.clientId;
    return value ? { value, label: currentTrip.name } : null;
  }, [currentTrip]);

  // Synthetic action rows. Their label equals the typed text, so Base UI's
  // built-in filter keeps them visible while typing, and picking one fills the
  // input with the clean name.
  const trimmed = query.trim();
  const normalized = trimmed.toLocaleLowerCase();
  const currentName = currentTrip?.name.trim() ?? "";
  const matchesSavedTrip = options.some(
    (option) => option.label.trim().toLocaleLowerCase() === normalized,
  );
  const matchesCurrentName = currentName.toLocaleLowerCase() === normalized;

  // Create a new trip unless the typed name already matches a trip.
  const showCreate = trimmed !== "" && !matchesSavedTrip && !matchesCurrentName;
  // Rename the current trip, but only once it has a name and the input differs.
  const showRename =
    trimmed !== "" && currentName !== "" && !matchesCurrentName;

  const items = useMemo<TripOption[]>(() => {
    const actions: TripOption[] = [];
    if (showRename) {
      actions.push({
        value: RENAME_OPTION_VALUE,
        label: trimmed,
        rename: trimmed,
      });
    }
    if (showCreate) {
      actions.push({
        value: CREATE_OPTION_VALUE,
        label: trimmed,
        create: trimmed,
      });
    }
    return [...options, ...actions];
  }, [options, trimmed, showCreate, showRename]);

  const handleValueChange = (option: TripOption | null) => {
    if (!option) return;
    if (option.rename) {
      renameTrip(option.rename);
      return;
    }
    if (option.create) {
      createTrip(option.create);
      return;
    }
    selectTrip(option.value);
  };

  return (
    <Combobox.Root<TripOption>
      items={items}
      value={selectedOption}
      onValueChange={handleValueChange}
      inputValue={query}
      onInputValueChange={setQuery}
      onOpenChange={(nextOpen) => {
        // Restore the trip name if the user cleared the input but closed without
        // picking anything, so the field always reflects the current trip.
        if (!nextOpen) setQuery(currentTrip?.name ?? "");
      }}
      itemToStringLabel={(option) => option.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
    >
      <Combobox.InputGroup className="relative flex w-full items-center">
        <Combobox.Input
          id={inputId}
          aria-label="Trip name"
          placeholder="e.g. Tour de France"
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-9 text-sm font-normal text-neutral-950 outline-none any-pointer-coarse:text-base"
        />

        <div className="absolute right-0 bottom-0 flex h-full items-center justify-center text-neutral-500 dark:text-neutral-400">
          <Combobox.Clear
            className="combobox-clear flex h-full w-6 items-center justify-center border-0 bg-transparent p-0 text-neutral-950"
            aria-label="Clear selection"
          >
            <XIcon />
          </Combobox.Clear>
          <Combobox.Trigger
            className="flex h-full w-6 items-center justify-center border-0 bg-transparent p-0 text-neutral-950"
            aria-label="Open trips list"
          >
            <CaretDownIcon />
          </Combobox.Trigger>
        </div>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner className="z-50 outline-none" sideOffset={4}>
          <Combobox.Popup className="max-h-[min(var(--available-height),20rem)] w-[var(--anchor-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-y-auto overscroll-contain rounded-md border border-gray-200 bg-white py-1 text-sm text-neutral-950 shadow-lg">
            <Combobox.Empty>
              <span className="block px-3 py-2 text-sm text-neutral-500">
                No trips found.
              </span>
            </Combobox.Empty>
            <Combobox.List>
              {(item: TripOption) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className="grid cursor-default grid-cols-[1.25rem_1fr] items-center gap-2 px-3 py-2 outline-none select-none data-highlighted:bg-neutral-100"
                >
                  {item.create ? (
                    <>
                      <span className="col-start-1 flex justify-center text-neutral-500">
                        <PlusIcon />
                      </span>
                      <span className="col-start-2">
                        Create &ldquo;{item.create}&rdquo;
                      </span>
                    </>
                  ) : item.rename ? (
                    <>
                      <span className="col-start-1 flex justify-center text-neutral-500">
                        <PencilIcon />
                      </span>
                      <span className="col-start-2">
                        Rename to &ldquo;{item.rename}&rdquo;
                      </span>
                    </>
                  ) : (
                    <>
                      <Combobox.ItemIndicator className="col-start-1 flex justify-center">
                        <CheckIcon />
                      </Combobox.ItemIndicator>
                      <span className="col-start-2">{item.label}</span>
                    </>
                  )}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
};

function PencilIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      style={{ display: "block", ...props.style }}
    >
      <path d="M11 2.5 13.5 5 5.5 13l-3 .5.5-3z" />
    </svg>
  );
}

function CheckIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: "block", ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

function PlusIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: "block", ...props.style }}
    >
      <path d="M1.5 8h13M8 14.5v-13" />
    </svg>
  );
}

function CaretDownIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
      style={{ display: "block", ...props.style }}
    >
      <path d="m3 4.5 3 3 3-3" />
    </svg>
  );
}

function XIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: "block", ...props.style }}
    >
      <path d="m4.5 4.5 7 7m-7 0 7-7" />
    </svg>
  );
}