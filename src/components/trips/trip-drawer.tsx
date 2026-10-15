"use client";

import { useMediaQuery } from "@base-ui/react/unstable-use-media-query";

import { Drawer } from "@base-ui/react/drawer";
import { TripContent } from "@/components/trips/trip-content";
import { RefObject, useState } from "react";
import type { Map } from "mapbox-gl";

const SM_MQ = "(min-width: 40rem)";
const SNAP_POINTS: Drawer.Root.SnapPoint[] = [0.5, 1];

export const tripDrawerHandle = Drawer.createHandle();

export const TripDrawer = ({ map }: { map: RefObject<Map | null> }) => {
  const isSm = useMediaQuery(SM_MQ, { defaultMatches: false });
  const [snapPoint, setSnapPoint] = useState<Drawer.Root.SnapPoint | null>(
    SNAP_POINTS[0],
  );

  return (
    <Drawer.Root
      modal={false}
      disablePointerDismissal
      handle={tripDrawerHandle}
      swipeDirection={isSm ? "right" : "down"}
      snapPoints={isSm ? undefined : SNAP_POINTS}
      snapPoint={snapPoint}
      onSnapPointChange={setSnapPoint}
    >
      <Drawer.SwipeArea
        className={"fixed bottom-0 h-5 w-full sm:right-0 sm:h-full sm:w-5"}
      />

      <Drawer.Portal>
        <Drawer.Backdrop
          className={
            "pointer-events-none fixed inset-0 min-h-dvh opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.2] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0"
          }
        />
        <Drawer.Viewport className="pointer-events-none fixed inset-0 z-3 flex items-end justify-center sm:items-stretch sm:justify-end sm:p-4">
          <Drawer.Popup
            className={
              "pointer-events-auto h-dvh w-full [transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] overflow-hidden overscroll-contain rounded-2xl bg-white [padding-bottom:max(0px,calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] text-neutral-950 shadow-xl transition-transform duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:[transform:translateY(100%)] data-ending-style:pb-0 data-starting-style:[transform:translateY(100%)] data-starting-style:pb-0 data-swiping:select-none sm:h-full sm:w-[min(100%,24rem)] sm:[transform:translateX(var(--drawer-swipe-movement-x))] sm:pb-0 sm:[--drawer-snap-point-offset:0px] sm:data-ending-style:[transform:translateX(100%)] sm:data-starting-style:[transform:translateX(100%)]"
            }
          >
            <TripContent map={map} />
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};