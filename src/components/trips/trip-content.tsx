import { Drawer } from "@base-ui/react/drawer";
import { useTravelStore } from "@/providers/travel-store-provider";
import { useShallow } from "zustand/react/shallow";
import { useState } from "react";
import { currentTripFrom } from "@/stores/travel-store";
import { RouteKind } from "@/components/map-box/directions";
import { TripForm } from "@/components/trips/trip-form";
import { CircleAddIcon } from "@/components/ui/icons/circle-add-icon";

const moveIds = (ids: string[], from: number, to: number) => {
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  if (!moved) return ids;
  next.splice(to, 0, moved);
  return next;
};

export const TripContent = ({ routeKind }: { routeKind: RouteKind }) => {
  const {
    trips,
    error,
    reorderStops,
    commitStopOrder,
    removeStop,
    renameTrip,
    createTrip,
    setTripStatus,
  } = useTravelStore(
    useShallow(
      ({
        trips,
        error,
        reorderStops,
        commitStopOrder,
        removeStop,
        renameTrip,
        createTrip,
        setTripStatus,
      }) => ({
        trips,
        error,
        reorderStops,
        commitStopOrder,
        removeStop,
        renameTrip,
        createTrip,
        setTripStatus,
      }),
    ),
  );

  const trip = currentTripFrom(trips);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const routeNote =
    routeKind === "directions"
      ? "Driving path from Mapbox Directions."
      : routeKind === "straight"
        ? "Straight line between stops. Directions needs 2 to 25 stops."
        : "Add a second stop to draw the path.";

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <Drawer.Title className="text-lg font-medium tracking-widest">
          Trip order
        </Drawer.Title>
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
              if (name && name !== trip.name)
                void renameTrip(trip.publicId, name);
            }}
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
          />
          {trip.stops.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Search an address or tap a place on the map, then add it to this
              trip.
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

      <div className={"flex h-full w-full flex-col"}>
        <div className={"p-4 pb-0"}>
          <Drawer.Title className={"flex flex-row justify-between gap-4"}>
            <p
              className={
                "flex w-full cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-2xl font-bold tracking-widest text-white"
              }
            >
              Trip
            </p>
            <div className="group flex flex-row justify-end">
              <Drawer.Close
                className={
                  "flex cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-xl font-bold tracking-widest text-white group-hover:bg-red-500"
                }
              >
                <CircleAddIcon className={"fill-none stroke-white"} />
              </Drawer.Close>
            </div>
          </Drawer.Title>
        </div>

        <TripForm />
      </div>
    </div>
  );
};