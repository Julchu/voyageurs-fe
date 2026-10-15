import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const useDebouncedState = <T,>(value: T, delay: number = 1000) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [delay, value]);

  return debouncedValue;
};

/**
 * Owns a controlled-input value and derives a debounced copy of it.
 *
 * Bind `value`/`setValue` to the input and read `debouncedValue` for effects
 * (e.g. network requests) so the request fires on a pause rather than on every
 * keystroke. Returns a tuple: `[value, debouncedValue, setValue]`.
 */
export const useDebouncedValue = <T,>(
  initial: T,
  delay: number = 300,
): readonly [T, T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(initial);
  const debouncedValue = useDebouncedState(value, delay);
  return [value, debouncedValue, setValue] as const;
};

export default useDebouncedState;
