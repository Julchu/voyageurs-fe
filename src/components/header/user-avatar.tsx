"use client";

import { useUserStore } from "@/providers/user-store-provider";
import Image from "next/image";
import { Avatar } from "@base-ui/react/avatar";
import { UserFilledIcon } from "@/components/ui/icons/person-icons";

export const UserAvatar = () => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  const [firstName, lastName] = userInfo?.name?.split(" ") ?? [];

  if (!userInfo)
    return <UserFilledIcon className="size-1/2 rounded-full fill-white" />;

  return (
    <Avatar.Root className="relative flex size-full items-center justify-center">
      <Avatar.Fallback>
        <span className="tracking-widest">
          {firstName[0]}
          {lastName[0]}
        </span>
      </Avatar.Fallback>
      {userInfo.image ? (
        <Avatar.Image
          keepMounted
          render={
            <Image
              src={userInfo.image}
              fill
              sizes="48px"
              alt="Voyageur"
              className={"rounded-full object-cover"}
            />
          }
        />
      ) : null}
    </Avatar.Root>
  );
};