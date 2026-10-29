import { Drawer } from "@base-ui/react/drawer";
import { useMediaQuery } from "@base-ui/react/unstable-use-media-query";
import { TripContent } from "@/components/trips-drawer/trip-content";
import {
  DESKTOP_MAP_QUERY,
  MOBILE_PANEL_SIZE,
  MOBILE_PANEL_VIEWPORT,
} from "@/components/map-box/map-panel-layout";
import { MapNavigation } from "@/components/trips-drawer/types";

// Simple handle to open drawer, doesn't have a payload
export const tripDrawerHandle = Drawer.createHandle();

export const TripDrawer = ({ map }: MapNavigation) => {
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
            <TripContent map={map} />
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};