import { Combobox } from "@base-ui/react/combobox";
import { MapSearchIcon } from "@/components/ui/icons/map-icons";
import type { Place } from "@/utils/interfaces";

export type AddressComboboxItem = Pick<
  Place,
  "name" | "streetAddress" | "areaAddress"
> & {
  id: string;
};

type AddressComboboxProps<Item extends AddressComboboxItem> = {
  query: string;
  results: Item[];
  selected: Item | null;
  open: boolean;
  loading: boolean;
  disabled: boolean;
  error?: string;
  onQueryChange: (query: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: Item) => void;
};

export const AddressCombobox = <Item extends AddressComboboxItem>({
  query,
  results,
  selected,
  open,
  loading,
  disabled,
  error,
  onQueryChange,
  onOpenChange,
  onSelect,
}: AddressComboboxProps<Item>) => {
  // Keep the selection available to Base UI without adding it to new results.
  const items =
    selected && !results.some((hit) => hit.id === selected.id)
      ? [...results, selected]
      : results;
  const trimmedQuery = query.trim();
  const status = loading
    ? "Searching…"
    : (error ??
      (trimmedQuery.length === 1
        ? "Type at least 2 characters to search."
        : undefined));

  return (
    <Combobox.Root<Item>
      items={items}
      filteredItems={results}
      filter={null}
      value={selected}
      inputValue={query}
      open={open && !disabled && (trimmedQuery !== "" || results.length > 0)}
      disabled={disabled}
      autoHighlight
      itemToStringLabel={(hit) => hit.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
      onInputValueChange={(value, { reason }) => {
        if (reason === "input-change") {
          onQueryChange(value);
        }
      }}
      onOpenChange={onOpenChange}
      onValueChange={(hit) => {
        if (hit) onSelect(hit);
      }}
    >
      <Combobox.InputGroup className="flex flex-row gap-2 rounded-xl bg-white px-2 shadow has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-neutral-100">
        <div className="flex shrink-0 items-center">
          <MapSearchIcon className="h-5 w-5 fill-none stroke-blue-500" />
        </div>
        <Combobox.Input
          className="h-10 w-full min-w-0 pr-4 text-base text-neutral-950 outline-none"
          aria-label="Search places and addresses"
          aria-busy={loading || disabled}
          placeholder="Search places and addresses"
          onFocus={() => onOpenChange(true)}
          onKeyDown={(event) => {
            // Async results can arrive after Base UI resets its highlight.
            if (
              event.key === "Enter" &&
              open &&
              !loading &&
              results[0] &&
              !event.nativeEvent.isComposing &&
              !event.currentTarget.getAttribute("aria-activedescendant")
            ) {
              event.preventDefault();
              onSelect(results[0]);
            }
          }}
        />
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner
          side="top"
          align="start"
          sideOffset={16}
          className="pointer-events-auto z-50 outline-none"
        >
          <Combobox.Popup
            aria-busy={loading}
            className="max-h-[var(--available-height)] w-[var(--anchor-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl bg-white p-2 text-base text-neutral-950 shadow transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none sm:max-h-38"
          >
            <Combobox.Status
              className={
                status ? "flex items-center px-3 text-neutral-500" : undefined
              }
            >
              {status}
            </Combobox.Status>
            <Combobox.Empty
              className={
                !status && results.length === 0
                  ? "flex h-full items-center px-3 text-neutral-500"
                  : undefined
              }
            >
              {!status ? "No locations found." : null}
            </Combobox.Empty>
            <Combobox.List
              aria-label={
                trimmedQuery ? "Location suggestions" : "Recent locations"
              }
              className="flex min-h-full flex-col justify-center gap-2 empty:hidden"
            >
              {(hit: Item) => (
                <Combobox.Item
                  key={hit.id}
                  value={hit}
                  className="group flex h-10 w-full shrink-0 cursor-pointer flex-col justify-center rounded-lg px-4 text-left tracking-widest transition-colors duration-150 outline-none select-none data-highlighted:bg-blue-500 data-highlighted:text-white motion-reduce:transition-none"
                >
                  <span className="block w-full truncate">{hit.name}</span>
                  <span className="block w-full truncate text-xs text-neutral-500 capitalize group-data-highlighted:text-white">
                    {[hit.streetAddress, hit.areaAddress]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
};
