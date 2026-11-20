import { useEffect, useState } from "react";

/**
 * An input value plus a copy that only updates after typing pauses. Bind
 * `value`/`setValue` to the input and use `debounced` for requests, so they
 * fire once per pause instead of on every keystroke.
 */
export const useDebouncedValue = <T>(initial: T, delay = 300) => {
  const [value, setValue] = useState(initial);
  const [debounced, setDebounced] = useState(initial);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return [value, debounced, setValue] as const;
};
