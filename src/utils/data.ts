/** Deep equality for plain JSON-like data (drafts, request bodies). */
export const isEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => isEqual(left[key], right[key]))
  );
};

/** Swaps IDs found in keys or string values, e.g. temporary IDs for saved ones. */
export const remapIds = <T>(value: T, ids: Record<string, string>): T => {
  if (typeof value === "string") return (ids[value] ?? value) as T;
  if (Array.isArray(value))
    return value.map((item) => remapIds(item, ids)) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        ids[key] ?? key,
        remapIds(item, ids),
      ]),
    ) as T;
  return value;
};

export const arrayMove = <T>(items: T[], from: number, to: number) => {
  const next = [...items];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

export const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
