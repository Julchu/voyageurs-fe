import type { MapboxCategoryId } from "@/types/mapbox";
import type { Place } from "@/utils/interfaces";

const categories = {
  coffee: {
    badgeClassName: "bg-teal-50 text-teal-800",
    placeholders: ["cafe", "coffee-cup", "coffee-cart"],
  },
  food: {
    badgeClassName: "bg-orange-50 text-orange-800",
    placeholders: ["bistro", "noodle-bowl", "terrace"],
  },
  lodging: {
    badgeClassName: "bg-violet-50 text-violet-800",
    placeholders: ["hotel", "cabin", "guesthouse"],
  },
  nature: {
    badgeClassName: "bg-green-50 text-green-800",
    placeholders: ["park", "mountains", "greenhouse"],
  },
  culture: {
    badgeClassName: "bg-purple-50 text-purple-800",
    placeholders: ["museum", "gallery", "theatre"],
  },
  other: {
    badgeClassName: "bg-blue-50 text-blue-800",
    placeholders: ["city", "bridge", "wayfinding"],
  },
} as const;

export type PlaceCategoryGroup = keyof typeof categories;

// Match complete words, so "parking" is not treated as "park".
const categoryGroups: [RegExp, PlaceCategoryGroup][] = [
  [/(^|_)(cafe|coffee)(_|$)/, "coffee"],
  [/(^|_)(restaurant|food|dining)(_|$)/, "food"],
  [/(^|_)(hotel|lodging|accommodation)(_|$)/, "lodging"],
  [/(^|_)(park|garden|nature)(_|$)/, "nature"],
  [/(^|_)(museum|art|gallery|culture)(_|$)/, "culture"],
];

export const getPlaceCategory = (category: MapboxCategoryId) => {
  const id = category
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const group =
    categoryGroups.find(([pattern]) => pattern.test(id))?.[1] ?? "other";
  return categories[group];
};

export const getPlacePlaceholder = (
  place: Pick<Place, "category" | "name" | "coordinates">,
) => {
  const { placeholders } = getPlaceCategory(place.category);
  // Vary by place without random changes on rerender, reopening, or hydration.
  const seed = `${place.name}:${place.coordinates.lat}:${place.coordinates.lng}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(index)) >>> 0;
  }
  return `/place-placeholders/${placeholders[hash % placeholders.length]}.svg`;
};
