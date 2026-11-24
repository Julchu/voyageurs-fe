import { createStore } from "zustand";
import { apiJson } from "@/api/client";
import type { Coordinates } from "@/types/place";
import type { UserInfo } from "@/types/user";

type UserState = {
  userInfo: UserInfo | null;
  lastLocation?: Coordinates;
};

type UserActions = {
  setLastLocation: (lastLocation: Coordinates) => void;
  /** Ends the session. Use `useLogout`, which also clears the other stores. */
  logout: () => Promise<void>;
};

type UserStore = UserState & UserActions;

export const initUserStore = (userInfo?: UserInfo | null): UserState => ({
  userInfo: userInfo ?? null,
  lastLocation: userInfo?.lastLocation,
});

export const createUserStore = (initialState: UserState) =>
  createStore<UserStore>()((set) => ({
    ...initialState,
    setLastLocation: (lastLocation) => set({ lastLocation }),
    logout: async () => {
      try {
        await apiJson("/api/logout", { method: "POST" });
      } finally {
        set(initUserStore());
      }
    },
  }));
