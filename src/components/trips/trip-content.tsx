import { Drawer } from "@base-ui/react/drawer";
import { TripForm } from "@/components/trips/trip-form";
import { CircleCloseIcon } from "@/components/ui/icons/circle-close-icon";
import { RefObject } from "react";
import type { Map } from "mapbox-gl";

export const TripContent = ({ map }: { map: RefObject<Map | null> }) => {
  return (
    <div className={"flex h-full w-full flex-col"}>
      <div className={"p-4"}>
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
              <CircleCloseIcon className={"fill-none stroke-white"} />
            </Drawer.Close>
          </div>
        </Drawer.Title>
      </div>

      <TripForm map={map} />
    </div>
  );
};