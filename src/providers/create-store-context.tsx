"use client";

import { createContext, useContext } from "react";
import { type StoreApi, useStore } from "zustand";

/** One store per React tree (so per request on the server), read with a selector hook. */
export const createStoreContext = <S,>(name: string) => {
  const Context = createContext<StoreApi<S> | null>(null);

  const useStoreApi = () => {
    const store = useContext(Context);
    if (!store) throw new Error(`${name} must be used within its provider`);
    return store;
  };

  const useSelector = <T,>(selector: (state: S) => T): T =>
    useStore(useStoreApi(), selector);

  return { Provider: Context.Provider, useStoreApi, useSelector };
};
