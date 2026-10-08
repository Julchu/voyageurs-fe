"use client";

import Link from "next/link";
import { useTripStore } from "@/providers/trip-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { currentTripFrom, previousTripsFrom } from "@/stores/trip-store-prev";
import { useShallow } from "zustand/react/shallow";

const TripsPage = () => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  const { trips, tripsLoadState } = useTripStore(
    useShallow(({ trips, tripsLoadState }) => ({
      trips,
      tripsLoadState,
    })),
  );

  const current = currentTripFrom(trips);
  const previous = previousTripsFrom(trips);

  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto px-4 pt-20 pb-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-medium tracking-widest">Trips</h1>
        <button
          type="button"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white"
          // onClick={() => void createTrip("Current trip")}
        >
          New trip
        </button>
      </div>
      {!userInfo ? (
        <p className="text-sm text-neutral-500">
          Sign in to keep trips on your account. Until then they stay in this
          browser.
        </p>
      ) : null}
      {tripsLoadState === "loading" ? (
        <p className="text-sm text-neutral-500">Loading trips</p>
      ) : null}
      {tripsLoadState === "error" ? (
        <p className="text-sm text-red-600">Trips could not be loaded.</p>
      ) : null}
      {/*{error ? <p className="text-sm text-red-600">{error}</p> : null}*/}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium tracking-widest text-neutral-500 uppercase">
          Current
        </h2>
        {current ? (
          <article className="rounded-xl bg-white p-4 shadow">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-medium">{current.name}</h3>
              <button
                type="button"
                className="text-sm text-neutral-500"
                // onClick={() => void setTripStatus(current.publicId, "previous")}
              >
                End trip
              </button>
            </div>
            {current.stops.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">No stops yet.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {current.stops.map((stop, index) => (
                  <li key={stop.publicId} className="text-sm">
                    <Link
                      href={`/?lat=${stop.coordinates.lat}&lng=${stop.coordinates.lng}`}
                      className="hover:underline"
                    >
                      {index + 1}. {stop.name}
                    </Link>
                    <span className="ml-2 text-xs text-neutral-500">
                      {stop.visited ? "Visited" : "Planned"}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <Link href="/" className="mt-3 inline-block text-sm text-blue-700">
              Reorder on the map
            </Link>
          </article>
        ) : (
          <p className="text-sm text-neutral-500">
            No current trip. Start one, then add places from the map.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium tracking-widest text-neutral-500 uppercase">
          Previous
        </h2>
        {previous.length === 0 ? (
          <p className="text-sm text-neutral-500">No previous trips.</p>
        ) : null}
        {previous.map((trip) => (
          <article
            key={trip.publicId}
            className="rounded-xl bg-white p-4 shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-medium">{trip.name}</h3>
              <button
                type="button"
                className="text-sm text-blue-700"
                // onClick={() => void setTripStatus(trip.publicId, "current")}
              >
                Make current
              </button>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {trip.stops.length} stops ·{" "}
              {trip.stops.filter((stop) => stop.visited).length} visited
            </p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default TripsPage;