import { create } from "zustand";
import type { Coordinates, UserInfo } from "@/utils/interfaces";

export type UserState = {
  userInfo: UserInfo | null;
  lastLocation?: Coordinates;
};

export type UserActions = {
  setUser: (userInfo: UserInfo | null) => void;
  setLastLocation: (coords: Coordinates) => void;
  logout: () => Promise<void>;
};

export type UserStore = UserState & UserActions;

export const initUserStore = (userInfo?: UserInfo | null): UserState => {
  return {
    userInfo: userInfo ?? null,
    lastLocation: userInfo?.lastLocation,
  };
};

export const defaultInitState: UserState = {
  userInfo: null,
  lastLocation: undefined,
};

export const createUserStore = (initialState: UserState = defaultInitState) => {
  return create<UserStore>((set) => ({
    userInfo: initialState.userInfo,
    lastLocation: initialState.lastLocation,
    setUser: (userInfo) =>
      set({
        userInfo,
        lastLocation: userInfo?.lastLocation,
      }),
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
        await fetch("/api/logout", { method: "POST" });
        set(() => ({ ...defaultInitState }));
      } catch (error) {
        throw new Error("Unable to logout", { cause: error });
      }
    },
  }));
};

export type UserStoreApi = ReturnType<typeof createUserStore>;