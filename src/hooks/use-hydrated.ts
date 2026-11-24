import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False on the server and during hydration. Gate UI that shows localStorage state with it. */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
