"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { useStore } from "zustand";
import type { UserInfo } from "@/utils/interfaces";
import {
  createUserStore,
  initUserStore,
  type UserStore,
  type UserStoreApi,
} from "@/stores/user-store";

export const UserStoreContext = createContext<UserStoreApi | undefined>(
  undefined,
);

export type UserStoreProviderProps = PropsWithChildren<{
  userInfo: UserInfo | null;
}>;

export const UserStoreProvider = ({
  children,
  userInfo,
}: UserStoreProviderProps) => {
  const [store] = useState(() => createUserStore(initUserStore(userInfo)));

  return (
    <UserStoreContext.Provider value={store}>
      {children}
    </UserStoreContext.Provider>
  );
};

export const useUserStore = <T,>(selector: (store: UserStore) => T): T => {
  const store = useContext(UserStoreContext);

  if (!store) {
    throw new Error("useUserStore must be used within UserStoreProvider");
  }

  return useStore(store, selector);
};