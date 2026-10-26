import { Drawer } from "@base-ui/react/drawer";
import { useMediaQuery } from "@base-ui/react/unstable-use-media-query";
import { TripContent } from "@/components/trips-drawer/trip-content";
import { RefObject, useState } from "react";
import type { Map } from "mapbox-gl";
import type { Coordinates } from "@/utils/interfaces";
import {
  DESKTOP_MAP_QUERY,
  MOBILE_PANEL_SIZE,
  MOBILE_PANEL_VIEWPORT,
} from "@/components/map-box/map-panel-layout";

type MapNavigation = {
  map?: RefObject<Map | null>;
  onFlyTo?: (coordinates: Coordinates, zoom?: number) => void;
};

// Simple handle to open drawer, doesn't have a payload
export const tripDrawerHandle = Drawer.createHandle();

export const TripDrawer = ({ map, onFlyTo }: MapNavigation) => {
  const isDesktop = useMediaQuery(DESKTOP_MAP_QUERY, { defaultMatches: false });

  return (
    <Drawer.Root
      modal={false}
      disablePointerDismissal
      handle={tripDrawerHandle}
      swipeDirection={isDesktop ? "right" : "down"}
    >
      <Drawer.SwipeArea className="fixed inset-x-0 bottom-0 h-5 sm:inset-x-auto sm:top-0 sm:right-0 sm:h-full sm:w-5" />
      <Drawer.Portal>
        <Drawer.Viewport
          className={`${MOBILE_PANEL_VIEWPORT} z-3 sm:top-20 sm:right-0 sm:bottom-18 sm:left-0 sm:h-auto sm:items-center sm:justify-end sm:px-4`}
        >
          <Drawer.Popup
            className={`pointer-events-auto relative flex ${MOBILE_PANEL_SIZE} [transform:translateY(var(--drawer-swipe-movement-y))] flex-col overflow-hidden overscroll-contain bg-white text-neutral-950 shadow transition-transform duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:[transform:translateY(calc(100%+var(--mobile-drawer-bottom)))] data-starting-style:[transform:translateY(calc(100%+var(--mobile-drawer-bottom)))] data-swiping:duration-0 data-swiping:select-none data-ending-style:data-swiping:duration-450 motion-reduce:transition-none sm:h-auto sm:w-[min(100%,24rem)] sm:[transform:translateX(var(--drawer-swipe-movement-x))] sm:data-ending-style:[transform:translateX(calc(100%+1rem))] sm:data-starting-style:[transform:translateX(calc(100%+1rem))]`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-2 left-1/2 z-10 h-1 w-12 -translate-x-1/2 rounded-full bg-neutral-300 sm:hidden"
            />
            <TripContent map={map} onFlyTo={onFlyTo} />
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

// Experimental mobile drawer split
// TODO: remove; unused snap points and unused mobile drawer (experimental)
const SNAP_POINTS: Drawer.Root.SnapPoint[] = [0.4, 1];

export const MobileDrawer = ({ map, onFlyTo }: MapNavigation) => {
  const [snapPoint, setSnapPoint] = useState<Drawer.Root.SnapPoint | null>(
    SNAP_POINTS[0],
  );

  return (
    <Drawer.Root
      modal={false}
      disablePointerDismissal
      handle={tripDrawerHandle}
      swipeDirection={"down"}
      snapPoints={SNAP_POINTS}
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
        <Drawer.Viewport className="pointer-events-none fixed inset-x-4 top-4 z-3 flex h-[calc(100dvh-1rem-var(--mobile-drawer-bottom))] items-end justify-center [--mobile-drawer-bottom:4.5rem]">
          <Drawer.Popup
            className={
              "group/mobile-drawer pointer-events-none h-full w-full shrink-0 [transform:translateY(var(--mobile-drawer-offset))] text-neutral-950 transition-[transform,opacity] duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none [--mobile-drawer-offset:max(0px,calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] data-ending-style:[transform:translateY(calc(100%+var(--mobile-drawer-bottom)))] data-ending-style:opacity-[0.9999] data-starting-style:[transform:translateY(calc(100%+var(--mobile-drawer-bottom)))] data-swiping:duration-0 data-swiping:select-none data-ending-style:data-swiping:duration-450 motion-reduce:transition-none starting:[transform:translateY(calc(100%+var(--mobile-drawer-bottom)))]"
            }
          >
            <div className="pointer-events-auto relative h-[max(40%,calc(100%-var(--mobile-drawer-offset)))] w-full overflow-hidden overscroll-contain rounded-2xl bg-white shadow transition-[height] duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-ending-style/mobile-drawer:duration-450 group-data-swiping/mobile-drawer:duration-0 motion-reduce:transition-none">
              {/* Drawer handle indicator*/}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-2 left-1/2 z-10 h-1 w-12 -translate-x-1/2 rounded-full bg-neutral-300"
              />
              <TripContent map={map} onFlyTo={onFlyTo} />
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};