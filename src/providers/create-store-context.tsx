"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { type StoreApi, useStore } from "zustand";

/** One store per React tree (so per request on the server): a Provider that creates it, and a selector hook. */
export const createStoreContext = <S, P>(
  name: string,
  create: (props: P) => StoreApi<S>,
) => {
  const Context = createContext<StoreApi<S> | null>(null);

  const Provider = (props: PropsWithChildren<P>) => {
    const [store] = useState(() => create(props));
    return <Context value={store}>{props.children}</Context>;
  };

  const useSelector = <T,>(selector: (state: S) => T): T => {
    const store = useContext(Context);
    if (!store) throw new Error(`${name} must be used within its provider`);
    return useStore(store, selector);
  };

  return { Provider, useSelector };
};
