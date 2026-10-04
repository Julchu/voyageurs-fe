"use client";

import { Drawer } from "@base-ui/react/drawer";
import { useTravelStore } from "@/providers/travel-store-provider";
import type { RouteKind } from "@/components/map-box/utils/directions";
import { FormProvider, useForm } from "react-hook-form";
import { TripContent } from "@/components/trips/trip-content";

export const tripDrawerHandle = Drawer.createHandle();

export const TripDrawer = ({ routeKind }: { routeKind: RouteKind }) => {
  const closeOrderDrawer = useTravelStore(
    ({ closeOrderDrawer }) => closeOrderDrawer,
  );

  const methods = useForm<{ test: string }>({
    defaultValues: { test: "cheese" },
  });

  return (
    <FormProvider {...methods}>
      <Drawer.Root
        handle={tripDrawerHandle}
        swipeDirection={"right"}
        onOpenChange={(next) => {
          if (!next) closeOrderDrawer();
        }}
        // TODO: reset form
        // onOpenChange={(open) => {
        //   if (open) methods.reset({ ingredients: pantryIngredients });
        // }}
        //
      >
        <Drawer.Portal>
          <Drawer.Backdrop
            className={
              "fixed inset-0 z-40 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.2] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0"
            }
          />
          <Drawer.Viewport className="fixed inset-0 z-40 flex items-stretch justify-end">
            <Drawer.Popup
              className={
                "z-40 h-full w-[min(100%,24rem)] [transform:translateX(var(--drawer-swipe-movement-x))] overflow-y-auto overscroll-contain bg-white/95 p-4 text-neutral-950 shadow-xl transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)] data-swiping:select-none"
              }
            >
              <TripContent routeKind={routeKind} />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </FormProvider>
  );
};