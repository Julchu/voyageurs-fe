"use client";

import { HamburgerMenuIcon, PersonIcon } from "@radix-ui/react-icons";
import { useUserStore } from "@/providers/user-store-provider";
import Image from "next/image";

export const UserAvatar = () => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);

  const imageUrl = userInfo?.image;

  if (!userInfo?.image)
    return <PersonIcon className={"size-1/2 rounded-full"} />;

  return (
    <>
      <Image
        src={imageUrl!}
        alt={"User avatar"}
        fill
        className={"rounded-full object-cover"}
      />
      <HamburgerMenuIcon
        className={"absolute h-1/2 w-1/2 text-blue-500 mix-blend-color-dodge"}
      />
    </>
  );
};
