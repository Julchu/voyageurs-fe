"use client";

import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { useStore } from "zustand";
import type { UserInfo } from "@/utils/interfaces";
import {
  createUserStore,
  defaultInitState,
  initUserStore,
  type UserStore,
  type UserStoreApi,
} from "@/stores/user-store";

export const UserStoreContext = createContext<UserStoreApi | undefined>(undefined);

export type UserStoreProviderProps = PropsWithChildren<{
  userInfo: UserInfo | null;
}>;

export const UserStoreProvider = ({ children, userInfo }: UserStoreProviderProps) => {
  const initialState = userInfo ? initUserStore(userInfo) : defaultInitState;
  const [userStoreState] = useState(() => createUserStore(initialState));

  return <UserStoreContext.Provider value={userStoreState}>{children}</UserStoreContext.Provider>;
};

export const useUserStore = <T,>(selector: (store: UserStore) => T): T => {
  const userStoreContext = useContext(UserStoreContext);

  if (!userStoreContext) {
    throw new Error("useUserStore must be used within UserStoreProvider");
  }

  return useStore(userStoreContext, selector);
};
