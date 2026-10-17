"use client";

import { useUserStore } from "@/providers/user-store-provider";
import Image from "next/image";
import { Avatar } from "@base-ui/react/avatar";
import { PersonIcon } from "@radix-ui/react-icons";

export const UserAvatar = () => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  const [firstName, lastName] = userInfo?.name?.split(" ") ?? [];

  if (!userInfo) return <PersonIcon className="size-1/2 rounded-full" />;

  return (
    <Avatar.Root>
      <Avatar.Fallback>
        <p className={"tracking-widest"}>
          {firstName[0]}
          {lastName[0]}
        </p>
      </Avatar.Fallback>
      {userInfo?.image ? (
        <Avatar.Image
          keepMounted
          render={
            <Image
              src={userInfo?.image}
              fill
              alt="Voyageur"
              className={"rounded-full object-cover"}
            />
          }
        />
      ) : null}
    </Avatar.Root>
  );
};