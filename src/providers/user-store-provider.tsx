"use client";

import type { UserInfo } from "@/types/user";
import { createUserStore, initUserStore } from "@/stores/user-store";
import { createStoreContext } from "./create-store-context";

const store = createStoreContext(
  "useUserStore",
  (props: { userInfo: UserInfo | null }) =>
    createUserStore(initUserStore(props.userInfo)),
);

export const UserStoreProvider = store.Provider;
export const useUserStore = store.useSelector;
