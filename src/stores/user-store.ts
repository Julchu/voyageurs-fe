import { create } from "zustand";
import type { Coordinates, UserInfo } from "@/utils/interfaces";

export type UserState = {
  userInfo: UserInfo | null;
  lastLocation?: Coordinates;
  performanceMode: boolean;
};

export type UserActions = {
  setUser: (userInfo: UserInfo | null) => void;
  setLastLocation: (coords: Coordinates) => void;
  setPerformanceMode: (enabled: boolean) => void;
  logout: () => Promise<void>;
};

export type UserStore = UserState & UserActions;

export const initUserStore = (userInfo?: UserInfo | null): UserState => {
  return {
    userInfo: userInfo ?? null,
    lastLocation: userInfo?.preferences?.lastLocation,
    performanceMode: userInfo?.preferences?.performanceMode ?? false,
  };
};

export const defaultInitState: UserState = {
  userInfo: null,
  lastLocation: undefined,
  performanceMode: false,
};

export const createUserStore = (initialState: UserState = defaultInitState) => {
  return create<UserStore>((set) => ({
    userInfo: initialState.userInfo,
    lastLocation: initialState.lastLocation,
    performanceMode: initialState.performanceMode,
    setUser: (userInfo) =>
      set({
        userInfo,
        lastLocation: userInfo?.preferences?.lastLocation,
        performanceMode: userInfo?.preferences?.performanceMode ?? false,
      }),
    setLastLocation: (coords) =>
      set((state) => ({
        lastLocation: coords,
        userInfo: state.userInfo
          ? {
              ...state.userInfo,
              preferences: { ...state.userInfo.preferences, lastLocation: coords },
            }
          : state.userInfo,
      })),
    setPerformanceMode: (enabled) =>
      set((state) => ({
        performanceMode: enabled,
        userInfo: state.userInfo
          ? {
              ...state.userInfo,
              preferences: { ...state.userInfo.preferences, performanceMode: enabled },
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
