"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useUserStore } from "@/providers/user-store-provider";
import { tripDrawerHandle } from "@/components/trips/trip-drawer";
import { Drawer } from "@base-ui/react/drawer";
import { useShallow } from "zustand/react/shallow";

export const UserMenu = () => {
  const { userInfo, logout } = useUserStore(
    useShallow(({ userInfo, logout }) => ({ userInfo, logout })),
  );

  const logoutHandler = () => {
    void logout();
    // TODO: clear trips and other user data
  };

  return (
    <Menu.Portal>
      <Menu.Positioner side={"bottom"} sideOffset={10} align={"end"}>
        <Menu.Popup
          className={
            "relative z-2 min-w-40 origin-(--transform-origin) rounded-md bg-white p-1 tracking-widest text-neutral-950 shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)] outline-hidden transition-[opacity,scale] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] select-none data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:transition-[opacity,scale] data-ending-style:duration-150 data-ending-style:ease-[ease] data-starting-style:scale-90 data-starting-style:opacity-0"
          }
        >
          <Menu.Arrow
            className={
              "relative block h-1.5 w-3 overflow-clip before:absolute before:bottom-0 before:left-1/2 before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:[transform:translate(-50%,50%)_rotate(45deg)] before:bg-white before:content-[''] data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180"
            }
          />

          <Menu.Separator className={"relative m-1 flex h-px bg-gray-200"} />

          <Menu.Group>
            <Menu.Separator className={"m-1 h-px bg-gray-200"} />
            <Menu.GroupLabel className="pl-4 text-xs leading-6 font-medium opacity-50">
              Trips
            </Menu.GroupLabel>

            {/* TODO: add another trigger/drawer for list of trips to select/load from */}
            <Drawer.Trigger
              handle={tripDrawerHandle}
              className={
                "text-md relative flex h-6 w-full cursor-pointer content-center items-center rounded-md py-4 pr-[5px] pl-[25px] leading-none outline-none hover:bg-blue-500 hover:text-white"
              }
            >
              Past Trips
            </Drawer.Trigger>

            <Drawer.Trigger
              handle={tripDrawerHandle}
              className={
                "text-md relative flex h-6 w-full cursor-pointer content-center items-center rounded-md py-4 pr-[5px] pl-[25px] leading-none outline-none hover:bg-blue-500 hover:text-white"
              }
            >
              Current Trip
            </Drawer.Trigger>
          </Menu.Group>

          <Menu.Group>
            <Menu.GroupLabel className="pl-4 text-xs leading-6 font-medium opacity-50">
              Account
            </Menu.GroupLabel>

            <Menu.Item
              className={
                "text-md relative flex h-6 content-center items-center rounded-md py-4 leading-none outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white"
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