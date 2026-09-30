"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { Menu } from "@base-ui/react/menu";
import { PersonIcon } from "@radix-ui/react-icons";
import { UserAvatar } from "@/components/header/user-avatar";
import { UserMenu } from "@/components/header/user-menu";

export const Hamburger = () => {
  const userInfo = useUserStore((state) => state.userInfo);
  const [firstName, lastName] = userInfo?.name?.split(" ") ?? [];

  return (
    <Menu.Root>
      <Menu.Trigger
        openOnHover
        className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 font-bold text-zinc-900 shadow select-none"
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
