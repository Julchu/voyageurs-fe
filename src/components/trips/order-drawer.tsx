"use client";

import { Drawer } from "@base-ui/react/drawer";
import { useState } from "react";
import { useTravelStore } from "@/providers/travel-store-provider";
import { currentTripFrom } from "@/stores/travel-store";
import type { RouteKind } from "@/components/map-box/directions";

const backdropClass =
  "fixed inset-0 z-40 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.2] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0";

const popupClass =
  "z-40 h-full w-[min(100%,24rem)] [transform:translateX(var(--drawer-swipe-movement-x))] overflow-y-auto overscroll-contain bg-white/95 p-4 text-neutral-950 shadow-xl transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)] data-swiping:select-none";

const moveIds = (ids: string[], from: number, to: number) => {
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  if (!moved) return ids;
  next.splice(to, 0, moved);
  return next;
};

export const OrderDrawer = ({ routeKind }: { routeKind: RouteKind }) => {
  const open = useTravelStore((state) => state.orderDrawerOpen);
  const closeOrderDrawer = useTravelStore((state) => state.closeOrderDrawer);
  const trips = useTravelStore((state) => state.trips);
  const error = useTravelStore((state) => state.error);
  const reorderStops = useTravelStore((state) => state.reorderStops);
  const commitStopOrder = useTravelStore((state) => state.commitStopOrder);
  const removeStop = useTravelStore((state) => state.removeStop);
  const renameTrip = useTravelStore((state) => state.renameTrip);
  const createTrip = useTravelStore((state) => state.createTrip);
  const setTripStatus = useTravelStore((state) => state.setTripStatus);
  const trip = currentTripFrom(trips);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const routeNote =
    routeKind === "directions"
      ? "Driving path from Mapbox Directions."
      : routeKind === "straight"
        ? "Straight line between stops. Directions needs 2 to 25 stops."
        : "Add a second stop to draw the path.";

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) closeOrderDrawer();
      }}
      swipeDirection="right"
    >
      <Drawer.Portal>
        <Drawer.Backdrop className={backdropClass} />
        <Drawer.Viewport className="fixed inset-0 z-40 flex items-stretch justify-end">
          <Drawer.Popup className={popupClass}>
            <div className="flex items-start justify-between gap-3">
              <Drawer.Title className="text-lg font-medium tracking-widest">Trip order</Drawer.Title>
              <Drawer.Close className="text-sm text-neutral-500">Close</Drawer.Close>
            </div>
            <Drawer.Description className="mt-1 text-sm text-neutral-500">
              Drag a stop to change the route. The map path follows this order.
            </Drawer.Description>
            <p className="mt-3 text-sm text-neutral-500">{routeNote}</p>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            {trip ? (
              <div className="mt-4 flex flex-col gap-3">
                <input
                  key={`${trip.publicId}-${trip.name}`}
                  aria-label="Trip name"
                  defaultValue={trip.name}
                  onBlur={(event) => {
                    const name = event.target.value.trim();
                    if (name && name !== trip.name) void renameTrip(trip.publicId, name);
                  }}
                  className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
                />
                {trip.stops.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    Search an address or tap a place on the map, then add it to this trip.
                  </p>
                ) : null}
                <ol className="flex flex-col gap-2">
                  {trip.stops.map((stop, index) => (
                    <li
                      key={stop.publicId}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (dragIndex === null || dragIndex === index) return;
                        const ids = moveIds(
                          trip.stops.map((item) => item.publicId),
                          dragIndex,
                          index,
                        );
                        setDragIndex(index);
                        void reorderStops(trip.publicId, ids, false);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragIndex(null);
                        void commitStopOrder(trip.publicId);
                      }}
                      className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-2"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{stop.name}</span>
                        <span className="block truncate text-xs text-neutral-500">
                          {stop.address || "No address"}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="text-xs text-neutral-500"
                        aria-label={`Move ${stop.name} up`}
                        disabled={index === 0}
                        onClick={() => {
                          const ids = moveIds(
                            trip.stops.map((item) => item.publicId),
                            index,
                            index - 1,
                          );
                          void reorderStops(trip.publicId, ids, true);
                        }}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="text-xs text-neutral-500"
                        aria-label={`Move ${stop.name} down`}
                        disabled={index === trip.stops.length - 1}
                        onClick={() => {
                          const ids = moveIds(
                            trip.stops.map((item) => item.publicId),
                            index,
                            index + 1,
                          );
                          void reorderStops(trip.publicId, ids, true);
                        }}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() => void removeStop(trip.publicId, stop.publicId)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  className="text-left text-sm text-neutral-600"
                  onClick={() => void setTripStatus(trip.publicId, "previous")}
                >
                  End trip
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">No current trip yet.</p>
            )}

            <button
              type="button"
              className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm text-white"
              onClick={() => void createTrip("Current trip")}
            >
              New trip
            </button>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
