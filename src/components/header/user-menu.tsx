"use client";

import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";
import {
  popupArrow,
  popupMotion,
  popupSurface,
} from "@/components/ui/popup-styles";
import { GoogleIcon } from "@/components/ui/icons/google-icon";
import { useUserStore } from "@/providers/user-store-provider";
import { useTripStore } from "@/providers/trip-store-provider";
import { useStopDetailsStore } from "@/providers/stop-details-store-provider";
import { tripDrawerHandle } from "@/components/trips-drawer/trip-drawer";
import { Drawer } from "@base-ui/react/drawer";
import { useShallow } from "zustand/react/shallow";
import { visitDrawerHandle } from "@/components/visits-drawer/visit-drawer";

const userMenuItem =
  "relative flex h-6 items-center rounded-lg py-4 leading-none transition-colors duration-150 outline-none data-highlighted:bg-blue-500 data-highlighted:text-white motion-reduce:transition-none";

export const UserMenu = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { userInfo, logout } = useUserStore(
    useShallow(({ userInfo, logout }) => ({ userInfo, logout })),
  );

  const clearTrips = useTripStore(({ clearTrips }) => clearTrips);
  const clearDetails = useStopDetailsStore(({ clearDetails }) => clearDetails);

  const logoutHandler = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Unable to logout", error);
    } finally {
      clearTrips();
      clearDetails();
      // TODO: Clear saved searches from memory and browser storage on logout,
      // and ignore search responses started before logout.
      setIsLoggingOut(false);
    }
  };

  return (
    <Menu.Portal>
      <Menu.Positioner side={"bottom"} sideOffset={16} align={"end"}>
        <Menu.Popup
          className={cn(
            popupSurface,
            popupMotion,
            "relative min-w-40 rounded-xl p-1 tracking-widest select-none",
          )}
        >
          <Menu.Arrow className={popupArrow} />

          <Menu.Group>
            <Menu.GroupLabel className="pl-4 text-xs leading-6 font-medium opacity-50">
              Trips
            </Menu.GroupLabel>

            <Menu.Item
              nativeButton
              render={<Drawer.Trigger handle={visitDrawerHandle} />}
              className={cn(
                userMenuItem,
                "w-full cursor-pointer pr-[5px] pl-[25px]",
              )}
            >
              {/* TODO: add another trigger/drawer for list of trips to select/load from */}
              Calendar
            </Menu.Item>

            <Menu.Item
              nativeButton
              render={<Drawer.Trigger handle={tripDrawerHandle} />}
              className={cn(
                userMenuItem,
                "w-full cursor-pointer pr-[5px] pl-[25px]",
              )}
            >
              Trip
            </Menu.Item>
          </Menu.Group>

          <Menu.Group>
            <Menu.GroupLabel className="pl-4 text-xs leading-6 font-medium opacity-50">
              Account
            </Menu.GroupLabel>

            {userInfo ? (
              <Menu.Item
                onClick={logoutHandler}
                disabled={isLoggingOut}
                className={cn(userMenuItem, "cursor-pointer pl-6")}
              >
                Logout
              </Menu.Item>
            ) : (
              <Menu.Item
                render={<a href="/api/login" />}
                className={cn(userMenuItem, "justify-center gap-x-2 px-2")}
              >
                <GoogleIcon />
                Sign in with Google
              </Menu.Item>
            )}
          </Menu.Group>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
};
