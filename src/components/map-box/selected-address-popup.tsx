import { Place } from "@/utils/interfaces";
import { useTripStore } from "@/providers/trip-store-provider";
import { CurrentLocationIcon } from "@/components/ui/icons/map-pins";
import * as React from "react";
import { RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "@/components/ui/icons/close-icons";
import { openPlacePopup } from "@/components/map-box/map-components";

export const SelectedAddressPopup = ({
  selected,
  setSelected,
  initialFocusRef,
  finalFocusRef,
}: {
  selected: Place | null;
  setSelected: (selectedPlaceDraft: Place | null) => void;
  initialFocusRef: RefObject<HTMLButtonElement | null>;
  finalFocusRef: RefObject<HTMLButtonElement | null>;
}) => {
  const addStop = useTripStore(({ addStop }) => addStop);

  // if (!selected) return;
  return (
    <Dialog.Root handle={openPlacePopup} modal={false} disablePointerDismissal>
      {({ payload }) => {
        if (!payload) return;
        return (
          <Dialog.Portal>
            <Dialog.Popup
              initialFocus={initialFocusRef}
              className="fixed top-1/2 left-1/2 -mt-8 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl bg-white p-4 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0"
            >
              <div className="flex flex-col gap-1">
                <header
                  className={"flex w-full flex-row justify-between gap-2"}
                >
                  <Dialog.Title className="text-base font-bold">
                    {payload.place.name}
                  </Dialog.Title>
                  <Dialog.Close>
                    <XIcon
                      className={
                        "h-5 w-5 cursor-pointer fill-blue-500 stroke-blue-500"
                      }
                    />
                  </Dialog.Close>
                </header>
                <Dialog.Description
                  className={
                    "flex flex-row items-center gap-1 text-sm text-neutral-600"
                  }
                >
                  <CurrentLocationIcon
                    className={"h-3 w-3 fill-none stroke-blue-500"}
                  />
                  {payload.place.streetAddress || "No address yet"}
                </Dialog.Description>
                <Dialog.Description className="text-sm text-neutral-600">
                  {payload.place.areaAddress || "No address yet"}
                </Dialog.Description>
                <Dialog.Description className="text-sm text-neutral-600">
                  {payload.place.category || "No category"}
                </Dialog.Description>
              </div>
              <div className="flex justify-end gap-3">
                <Dialog.Close
                  ref={initialFocusRef}
                  onClick={() => {
                    addStop(payload.place);
                  }}
                  className="flex h-8 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm leading-none font-normal whitespace-nowrap text-white select-none hover:not-data-disabled:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 active:not-data-disabled:bg-neutral-200 disabled:border-neutral-500 disabled:text-neutral-500 data-disabled:border-neutral-500 data-disabled:text-neutral-500 dark:hover:not-data-disabled:bg-neutral-800 dark:focus-visible:outline-white dark:active:not-data-disabled:bg-neutral-700 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400"
                >
                  Add to trip
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        );
      }}
    </Dialog.Root>
  );
};