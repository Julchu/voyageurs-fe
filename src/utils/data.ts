const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** True when two JSON-like values (drafts, request bodies) hold the same data. */
export const isEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (!isObject(a) || !isObject(b) || Array.isArray(a) !== Array.isArray(b))
    return false;

  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => isEqual(a[key], b[key]))
  );
};

/**
 * A copy of `value` with IDs swapped wherever they appear, as object keys or
 * string values. After a save, this moves drafts from temporary client IDs to
 * the IDs the server gave: `replaceIds({ [tempId]: x }, { [tempId]: savedId })`.
 */
export const replaceIds = <T>(value: T, ids: Record<string, string>): T => {
  const swap = (id: string) => ids[id] ?? id;

  if (typeof value === "string") return swap(value) as T;
  if (Array.isArray(value))
    return value.map((item) => replaceIds(item, ids)) as T;
  if (isObject(value))
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        swap(key),
        replaceIds(item, ids),
      ]),
    ) as T;
  return value;
};

/** A copy of `items` with the item at `from` moved to `to`. */
export const moveItem = <T>(items: T[], from: number, to: number) => {
  const next = [...items];
  const removed = next.splice(from, 1);
  next.splice(to, 0, ...removed);
  return next;
};

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
