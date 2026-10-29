import { Drawer } from "@base-ui/react/drawer";
import { TripForm } from "@/components/trips-drawer/trip-form";
import { CircleCloseIcon } from "@/components/ui/icons/close-icons";
import { useUserStore } from "@/providers/user-store-provider";
import { TripSelector } from "@/components/trips-drawer/trip-selector";
import { Separator } from "@base-ui/react";
import { MapNavigation } from "@/components/trips-drawer/types";

export const TripContent = ({ map }: MapNavigation) => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  return (
    <div className={"flex min-h-0 w-full flex-auto flex-col"}>
      <div className={"shrink-0 p-4"}>
        <Drawer.Title className={"flex flex-row justify-between gap-4"}>
          {userInfo ? (
            <TripSelector />
          ) : (
            <p
              className={
                "flex w-full cursor-pointer rounded-2xl bg-blue-500 px-4 py-2 text-2xl font-bold tracking-widest text-white"
              }
            >
              My Trip
            </p>
          )}

          <div className="group flex flex-row justify-end">
            <Drawer.Close
              className={
                "flex cursor-pointer rounded-2xl bg-blue-500 p-2 text-xl font-bold tracking-widest text-white group-hover:bg-red-500"
              }
            >
              <CircleCloseIcon className={"fill-none stroke-white"} />
            </Drawer.Close>
          </div>
        </Drawer.Title>
      </div>

      <Separator className={"h-px bg-gray-200"} />

      <TripForm map={map} />
    </div>
  );
};