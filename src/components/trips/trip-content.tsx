"use client";
import { Drawer } from "@base-ui/react/drawer";
import { TripForm } from "@/components/trips/trip-form";
import { CircleCloseIcon } from "@/components/ui/icons/close-icons";
import { RefObject } from "react";
import type { Map } from "mapbox-gl";
import { useTripStore } from "@/providers/trip-store-provider";

export const TripContent = ({ map }: { map: RefObject<Map | null> }) => {
  const currentTrip = useTripStore(({ currentTrip }) => currentTrip);
  return (
    <div className={"flex h-full w-full flex-col"}>
      <div className={"shrink-0 p-4"}>
        <Drawer.Title className={"flex flex-row justify-between gap-4"}>
          <p
            className={
              "flex w-full cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-2xl font-bold tracking-widest text-white"
            }
          >
            {currentTrip?.name || "Trip"}
          </p>
          <div className="group flex flex-row justify-end">
            <Drawer.Close
              className={
                "flex cursor-pointer rounded-md bg-blue-500 p-2 text-xl font-bold tracking-widest text-white group-hover:bg-red-500"
              }
            >
              <CircleCloseIcon className={"fill-none stroke-white"} />
            </Drawer.Close>
          </div>
        </Drawer.Title>
      </div>

      <TripForm map={map} />
    </div>
  );
};