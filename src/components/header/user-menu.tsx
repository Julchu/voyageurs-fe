"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { GoogleIcon } from "@/components/ui/icons/google-icon";
import { useUserStore } from "@/providers/user-store-provider";
import { useTripStore } from "@/providers/trip-store-provider";
import { tripDrawerHandle } from "@/components/trips-drawer/trip-drawer";
import { Drawer } from "@base-ui/react/drawer";
import { useShallow } from "zustand/react/shallow";
import { visitDrawerHandle } from "@/components/visits-drawer/visit-drawer";

export const UserMenu = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { userInfo, logout } = useUserStore(
    useShallow(({ userInfo, logout }) => ({ userInfo, logout })),
  );

  const clearTrips = useTripStore(({ clearTrips }) => clearTrips);

  const logoutHandler = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Unable to logout", error);
    } finally {
      clearTrips();
      // TODO: Clear saved searches from memory and browser storage on logout,
      // and ignore search responses started before logout.
      setIsLoggingOut(false);
    }
  };

  return (
    <Menu.Portal>
      <Menu.Positioner side={"bottom"} sideOffset={16} align={"end"}>
        <Menu.Popup
          className={
            "relative min-w-40 origin-(--transform-origin) rounded-xl bg-white p-1 tracking-widest text-neutral-950 shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)] outline-hidden transition-[scale,opacity] duration-150 ease-out select-none data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none"
          }
        >
          <Menu.Arrow
            className={
              "relative block h-1.5 w-3 overflow-clip before:absolute before:bottom-0 before:left-1/2 before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:[transform:translate(-50%,50%)_rotate(45deg)] before:bg-white before:content-[''] data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180"
            }
          />

          <Menu.Group>
            <Menu.GroupLabel className="pl-4 text-xs leading-6 font-medium opacity-50">
              Trips
            </Menu.GroupLabel>

            <Menu.Item
              nativeButton
              render={<Drawer.Trigger handle={visitDrawerHandle} />}
              className={
                "text-md relative flex h-6 w-full cursor-pointer content-center items-center rounded-lg py-4 pr-[5px] pl-[25px] leading-none transition-colors duration-150 outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white motion-reduce:transition-none"
              }
            >
              {/* TODO: add another trigger/drawer for list of trips to select/load from */}
              Calendar
            </Menu.Item>

            <Menu.Item
              nativeButton
              render={<Drawer.Trigger handle={tripDrawerHandle} />}
              className={
                "text-md relative flex h-6 w-full cursor-pointer content-center items-center rounded-lg py-4 pr-[5px] pl-[25px] leading-none transition-colors duration-150 outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white motion-reduce:transition-none"
              }
            >
              Trip
            </Menu.Item>
          </Menu.Group>

          <Menu.Group>
            <Menu.GroupLabel className="pl-4 text-xs leading-6 font-medium opacity-50">
              Account
            </Menu.GroupLabel>

            <Menu.Item
              onClick={userInfo ? logoutHandler : undefined}
              disabled={isLoggingOut}
              className={
                "text-md relative flex h-6 content-center items-center rounded-lg py-4 leading-none transition-colors duration-150 outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white motion-reduce:transition-none"
              }
            >
              {userInfo ? (
                <p
                  onClick={logoutHandler}
                  className="ml-6 w-full cursor-pointer"
                >
                  Logout
                </p>
              ) : (
                <Link
                  href={"/api/login"}
                  className={
                    "flex w-full items-center justify-center gap-x-2 p-2"
                  }
                >
                  <GoogleIcon />
                  <p>Sign in with Google</p>
                </Link>
              )}
            </Menu.Item>
          </Menu.Group>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
};
