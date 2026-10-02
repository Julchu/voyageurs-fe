"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { Menu } from "@base-ui/react/menu";
import { PersonIcon } from "@radix-ui/react-icons";
import { UserAvatar } from "@/components/header/user-avatar";
import { UserMenu } from "@/components/header/user-menu";

export const Hamburger = () => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  const [firstName, lastName] = userInfo?.name?.split(" ") ?? [];

  return (
    <Menu.Root>
      <Menu.Trigger
        openOnHover
        className={
          "relative inline-flex aspect-square h-full cursor-pointer items-center justify-center rounded-full bg-blue-500 font-bold text-white select-none"
        }
        aria-label="User menu"
      >
        {userInfo?.image ? (
          <UserAvatar />
        ) : (
          <>
            {firstName && lastName ? (
              <>
                {firstName[0]}
                {lastName[0]}
              </>
            ) : (
              <PersonIcon className="size-1/2 rounded-full" />
            )}
          </>
        )}
      </Menu.Trigger>

      <UserMenu />
    </Menu.Root>
  );
};