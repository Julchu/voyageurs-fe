"use client";

import { useUserStore } from "@/providers/user-store-provider";
import Image from "next/image";
import { Avatar } from "@base-ui/react/avatar";
import { UserFilledIcon } from "@/components/ui/icons/person-icons";

export const UserAvatar = () => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  if (!userInfo)
    return <UserFilledIcon className="size-1/2 rounded-full fill-white" />;

  const initials = userInfo.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return (
    <Avatar.Root className="relative flex size-full items-center justify-center">
      <Avatar.Fallback>
        <span className="tracking-widest">{initials}</span>
      </Avatar.Fallback>
      {userInfo.image ? (
        <Avatar.Image
          keepMounted
          render={
            <Image
              src={userInfo.image}
              fill
              sizes="48px"
              alt=""
              className={"rounded-full object-cover"}
            />
          }
        />
      ) : null}
    </Avatar.Root>
  );
};
