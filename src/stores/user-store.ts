import { create } from "zustand";
import type { Coordinates, UserInfo } from "@/utils/interfaces";

export type UserState = {
  userInfo: UserInfo | null;
  lastLocation?: Coordinates;
};

export type UserActions = {
  setLastLocation: (coords: Coordinates) => void;
  logout: () => Promise<void>;
};

export type UserStore = UserState & UserActions;

export const initUserStore = (userInfo?: UserInfo | null): UserState => ({
  userInfo: userInfo ?? null,
  lastLocation: userInfo?.lastLocation,
});

export const createUserStore = (initialState: UserState = initUserStore()) => {
  return create<UserStore>((set) => ({
    ...initialState,
    setLastLocation: (coords) =>
      set((state) => ({
        lastLocation: coords,
        userInfo: state.userInfo
          ? {
              ...state.userInfo,
              lastLocation: coords,
            }
          : state.userInfo,
      })),
    logout: async () => {
      try {
        const response = await fetch("/api/logout", { method: "POST" });
        if (!response.ok) {
          throw new Error(`Logout request failed (${response.status})`);
        }
      } finally {
        set(initUserStore());
      }
    },
  }));
};

export type UserStoreApi = ReturnType<typeof createUserStore>;
