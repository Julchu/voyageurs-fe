/** The first item for each key, in their original order. */
export const uniqueBy = <T>(items: T[], keyOf: (item: T) => string) => {
  // Reversed so the first index for a key is the one the Map keeps.
  const firstIndex = new Map(
    items.map((item, index) => [keyOf(item), index] as const).reverse(),
  );
  return items.filter((item, index) => firstIndex.get(keyOf(item)) === index);
};
