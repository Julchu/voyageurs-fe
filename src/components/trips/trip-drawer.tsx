"use client";

import { Drawer } from "@base-ui/react/drawer";
import { TripContent } from "@/components/trips/trip-content";

export const tripDrawerHandle = Drawer.createHandle();

export const TripDrawer = () => {
  // const snapPoints = ["148px", 1];
  // const [snapPoint, setSnapPoint] = useState<Drawer.Root.SnapPoint | null>(
  //   snapPoints[0],
  // );

  return (
    <Drawer.Root
      modal={false}
      disablePointerDismissal
      handle={tripDrawerHandle}
      swipeDirection={"right"}
      // TODO: create mobile version (no swipeDirection, default bottom up)
      // snapPoints={snapPoints}
      // snapPoint={snapPoint}
      // onSnapPointChange={setSnapPoint}
    >
      <Drawer.SwipeArea className="absolute inset-y-0 right-0 w-5 sm:w-10 dark:border-blue-500 dark:bg-blue-500/10" />

      <Drawer.Portal>
        <Drawer.Backdrop
          className={
            "pointer-events-none fixed inset-0 min-h-dvh opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.2] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0"
          }
        />
        <Drawer.Viewport className="pointer-events-none fixed inset-0 z-3 flex items-stretch justify-end">
          <Drawer.Popup
            className={
              "pointer-events-auto h-full w-[min(100%,24rem)] [transform:translateX(var(--drawer-swipe-movement-x))] overflow-y-auto overscroll-contain bg-white/95 text-neutral-950 shadow-xl transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)] data-swiping:select-none"
            }
          >
            <TripContent />
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};