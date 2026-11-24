"use client";

import { type PropsWithChildren, useState } from "react";
import type { UserInfo } from "@/types/user";
import {
  createUserStore,
  initUserStore,
  type UserStore,
} from "@/stores/user-store";
import { createStoreContext } from "./create-store-context";

const { Provider, useSelector } = createStoreContext<UserStore>("useUserStore");

export const useUserStore = useSelector;

export const UserStoreProvider = ({
  children,
  userInfo,
}: PropsWithChildren<{ userInfo: UserInfo | null }>) => {
  const [store] = useState(() => createUserStore(initUserStore(userInfo)));
  return <Provider value={store}>{children}</Provider>;
};
