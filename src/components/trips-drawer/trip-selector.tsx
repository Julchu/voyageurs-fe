"use client";
import { cn } from "cn";
import { useTripStore } from "@/providers/trip-store-provider";
import { useShallow } from "zustand/react/shallow";
import { Select } from "@base-ui/react/select";
import {
  CaretCircleDownIcon,
  CaretDownIcon,
  CaretUpIcon,
} from "@/components/ui/icons/caret-icons";
import { PinPencilIcon } from "@/components/ui/icons/pin-icons";
import { MapCurrentIcon } from "@/components/ui/icons/map-icons";
import { popupMotion, popupSurface } from "@/components/ui/popup-styles";

type TripOption = {
  value: string;
  label: string;
};

// Select value for the "New Trip" entry. Trip values are IDs, so it can't clash.
const NEW_TRIP = "new-trip";

const itemClass =
  "group/item grid cursor-pointer grid-cols-[1.5rem_1fr] items-center gap-2 rounded-lg py-1.5 pr-4 pl-2.5 text-sm outline-hidden transition-colors duration-150 select-none data-highlighted:bg-blue-500 data-highlighted:text-white motion-reduce:transition-none";

export const TripSelector = () => {
  const { trips, selectTrip, currentTrip, createTrip } = useTripStore(
    useShallow(({ trips, selectTrip, currentTrip, createTrip }) => ({
      trips,
      selectTrip,
      currentTrip,
      createTrip,
    })),
  );

  const currentValue = currentTrip.publicId ?? currentTrip.clientId;
  // The draft's name wins over the saved one; an unsaved draft is listed first.
  const options: TripOption[] = trips.map(({ publicId, name }) => ({
    value: publicId,
    label: publicId === currentValue ? currentTrip.name : name,
  }));
  const selectValues = options.some(({ value }) => value === currentValue)
    ? options
    : [{ value: currentValue, label: currentTrip.name }, ...options];

  const handleValueChange = (tripId: string | null) => {
    if (!tripId) return;
    if (tripId === NEW_TRIP) return createTrip("New Trip");
    selectTrip(tripId);
  };

  return (
    <Select.Root
      onValueChange={handleValueChange}
      items={selectValues}
      value={currentValue}
    >
      <Select.Trigger className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-blue-500 p-2 pl-4 text-xl font-bold tracking-widest text-white">
        <Select.Value placeholder="Select trip" />
        <Select.Icon>
          <CaretCircleDownIcon className={"h-6 w-6 fill-none stroke-white"} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className="z-10 outline-none select-none"
          align="center"
          sideOffset={4}
        >
          <Select.Popup
            className={cn(
              popupSurface,
              popupMotion,
              "group relative min-w-[var(--anchor-width)] overflow-hidden rounded-lg data-[side=none]:min-w-[calc(var(--anchor-width)+1.75rem)] data-[side=none]:translate-y-px data-[side=none]:data-ending-style:transition-none data-[side=none]:data-starting-style:scale-100 data-[side=none]:data-starting-style:opacity-100 data-[side=none]:data-starting-style:transition-none",
            )}
          >
            <Select.ScrollUpArrow className="top-0 z-1 flex h-4 w-full cursor-default items-center justify-center bg-white text-center text-xs before:absolute before:left-0 before:h-full before:w-full before:content-[''] data-[side=none]:before:top-[-100%]">
              <CaretUpIcon className={"h-6 w-6 fill-none stroke-blue-500"} />
            </Select.ScrollUpArrow>
            <Select.List className="relative flex max-h-[var(--available-height)] scroll-py-6 flex-col overflow-y-auto p-1 tracking-widest outline-hidden transition-[opacity,scale] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]">
              {selectValues.map(({ label, value }) => (
                <Select.Item
                  // Saving a draft swaps its value for a public ID. A fixed key keeps its item mounted.
                  key={
                    !currentTrip.publicId && value === currentTrip.clientId
                      ? "current-draft"
                      : value
                  }
                  value={value}
                  className={itemClass}
                >
                  <Select.ItemIndicator className="col-start-1">
                    <MapCurrentIcon
                      className={
                        "h-6 w-6 fill-none stroke-green-500 group-data-highlighted/item:stroke-white"
                      }
                    />
                  </Select.ItemIndicator>
                  <Select.ItemText className="col-start-2">
                    {label}
                  </Select.ItemText>
                </Select.Item>
              ))}
              <Select.Item value={NEW_TRIP} className={itemClass}>
                <Select.ItemIndicator className="col-start-1">
                  <PinPencilIcon
                    className={
                      "h-6 w-6 fill-green-500 stroke-green-500 group-data-highlighted/item:stroke-white"
                    }
                  />
                </Select.ItemIndicator>
                <Select.ItemText className="col-start-2">
                  New Trip
                </Select.ItemText>
              </Select.Item>
            </Select.List>

            <Select.ScrollDownArrow className="bottom-0 z-1 flex h-4 w-full cursor-default items-center justify-center bg-white text-center text-xs before:absolute before:left-0 before:h-full before:w-full before:content-[''] data-[side=none]:before:bottom-[-100%]">
              <CaretDownIcon className={"h-6 w-6 fill-none stroke-blue-500"} />
            </Select.ScrollDownArrow>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};
