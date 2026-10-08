"use client";

import { Drawer } from "@base-ui/react/drawer";
import { useTripStore } from "@/providers/trip-store-provider";
import { currentTripFrom } from "@/stores/trip-store-prev";

// Mounted with the map. Open it later with openVisitDrawer(); no control is wired yet.
export const VisitDrawer = () => {
  const open = useTripStore((state) => state.visitDrawerOpen);
  const closeVisitDrawer = useTripStore((state) => state.closeVisitDrawer);
  const trips = useTripStore((state) => state.trips);
  const setVisited = useTripStore((state) => state.setVisited);
  const trip = currentTripFrom(trips);
  const visitedCount = trip?.stops.filter((stop) => stop.visited).length ?? 0;

  return (
    <Drawer.Root
      open={true}
      onOpenChange={(next) => {
        if (!next) closeVisitDrawer();
      }}
      swipeDirection={"right"}
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className={
            "fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.2] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0"
          }
        />
        <Drawer.Viewport className="fixed inset-0 flex items-stretch justify-end">
          <Drawer.Popup
            className={
              "h-full w-[min(100%,24rem)] [transform:translateX(var(--drawer-swipe-movement-x))] overflow-y-auto overscroll-contain bg-white/95 p-4 text-neutral-950 shadow-xl transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)] data-swiping:select-none"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <Drawer.Title className="text-lg font-medium tracking-widest">
                Visited
              </Drawer.Title>
              <Drawer.Close className="text-sm text-neutral-500">
                Close
              </Drawer.Close>
            </div>
            <Drawer.Description className="mt-1 text-sm text-neutral-500">
              {trip
                ? `${visitedCount} of ${trip.stops.length} checked off on ${trip.name}.`
                : "Start a trip to check off places."}
            </Drawer.Description>
            {trip && trip.stops.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-2">
                {trip.stops.map((stop, index) => (
                  <li key={stop.publicId}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={stop.visited}
                        onChange={(event) =>
                          void setVisited(
                            trip.publicId,
                            stop.publicId,
                            event.target.checked,
                          )
                        }
                      />
                      <span>
                        <span className="block text-sm">
                          {index + 1}. {stop.name}
                        </span>
                        <span className="block text-xs text-neutral-500">
                          {stop.address || "No address"}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                Nothing to check off yet.
              </p>
            )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};