"use client";
import { useMemo } from "react";
import { useTripStore } from "@/providers/trip-store-provider";
import { useShallow } from "zustand/react/shallow";
import { Select } from "@base-ui/react/select";
import {
  CaretCircleDownIcon,
  CaretDownIcon,
  CaretUpIcon,
} from "@/components/ui/icons/caret-icons";
import { MapPinCheckIcon } from "@/components/ui/icons/map-icons";

type TripOption = {
  value: string;
  label: string;
};

export const TripSelector = () => {
  const { trips, selectTrip, currentTrip } = useTripStore(
    useShallow(({ trips, selectTrip, currentTrip }) => ({
      trips,
      selectTrip,
      currentTrip,
    })),
  );

  // TODO: add Trip createdAt/updatedat fields and sort
  const selectValues = useMemo<TripOption[]>(
    () =>
      trips.flatMap(({ publicId, clientId, name }) => {
        const value = publicId ?? clientId;
        return value ? [{ value, label: name }] : [];
      }),
    [trips],
  );

  const handleValueChange = (tripId: string | null) => {
    if (!tripId) return;
    selectTrip(tripId);
  };

  return (
    <Select.Root
      onValueChange={handleValueChange}
      items={selectValues}
      value={currentTrip?.publicId ?? currentTrip?.clientId ?? null}
    >
      <Select.Trigger className="flex w-full cursor-pointer items-center justify-between rounded-md bg-blue-500 p-2 text-xl font-bold tracking-widest text-white">
        <Select.Value
          className="data-placeholder:text-neutral-500"
          placeholder="Select trip"
        />
        <Select.Icon>
          <CaretCircleDownIcon className={"h-6 w-6 fill-none stroke-white"} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className="z-10 outline-hidden select-none"
          align="center"
          sideOffset={4}
        >
          <Select.Popup className="group min-w-[var(--anchor-width)] origin-[var(--transform-origin)] rounded-lg border border-gray-200 bg-white bg-clip-padding text-neutral-950 outline-hidden transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-[side=none]:min-w-[calc(var(--anchor-width)+1.75rem)] data-[side=none]:translate-y-px data-[side=none]:data-ending-style:transition-none data-[side=none]:data-starting-style:scale-100 data-[side=none]:data-starting-style:opacity-100 data-[side=none]:data-starting-style:transition-none">
            <Select.ScrollUpArrow className="top-0 z-1 flex h-4 w-full cursor-default items-center justify-center bg-white text-center text-xs before:absolute before:left-0 before:h-full before:w-full before:content-[''] data-[side=none]:before:top-[-100%]">
              <CaretUpIcon className={"h-6 w-6 fill-none stroke-blue-500"} />
            </Select.ScrollUpArrow>
            <Select.List className="relative flex max-h-[var(--available-height)] scroll-py-6 flex-col overflow-y-auto p-1 tracking-widest shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)] outline-hidden transition-[opacity,scale] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]">
              {selectValues.map(({ label, value }) => (
                <Select.Item
                  key={label}
                  value={value}
                  className="group/item grid cursor-default grid-cols-[1.5rem_1fr] items-center gap-2 rounded-lg py-1.5 pr-4 pl-2.5 text-sm outline-hidden select-none data-highlighted:bg-blue-500 data-highlighted:text-white"
                >
                  <Select.ItemIndicator className="col-start-1">
                    <MapPinCheckIcon
                      className={
                        "h-6 w-6 fill-none stroke-green-500 group-hover/item:stroke-white"
                      }
                    />
                  </Select.ItemIndicator>
                  <Select.ItemText className="col-start-2">
                    {label}
                  </Select.ItemText>
                </Select.Item>
              ))}
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
