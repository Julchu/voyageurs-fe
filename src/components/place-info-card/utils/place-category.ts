import type { MapboxCategoryId } from "@/types/mapbox";
import type { Place } from "@/utils/interfaces";
import { removeAccents } from "@/utils/place-name";

// A category matches a group when one of its words is in `words`. Whole words
// only, so "parking" is not a "park". `other` is the fallback.
const categories = [
  {
    words: ["cafe", "coffee"],
    badgeClassName: "bg-teal-50 text-teal-800",
    placeholders: ["cafe", "coffee-cup", "coffee-cart"],
  },
  {
    words: ["restaurant", "food", "dining"],
    badgeClassName: "bg-orange-50 text-orange-800",
    placeholders: ["bistro", "noodle-bowl", "terrace"],
  },
  {
    words: ["hotel", "lodging", "accommodation"],
    badgeClassName: "bg-violet-50 text-violet-800",
    placeholders: ["hotel", "cabin", "guesthouse"],
  },
  {
    words: ["park", "garden", "nature"],
    badgeClassName: "bg-green-50 text-green-800",
    placeholders: ["park", "mountains", "greenhouse"],
  },
  {
    words: ["museum", "art", "gallery", "culture"],
    badgeClassName: "bg-purple-50 text-purple-800",
    placeholders: ["museum", "gallery", "theatre"],
  },
];

const other = {
  words: [],
  badgeClassName: "bg-blue-50 text-blue-800",
  placeholders: ["city", "bridge", "wayfinding"],
};

/** "Coffee-Shop" or "coffee_shop" → ["coffee", "shop"] */
const wordsOf = (category: MapboxCategoryId) =>
  removeAccents(category)
    .toLowerCase()
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .split(" ");

export const getPlaceCategory = (category: MapboxCategoryId) => {
  const words = wordsOf(category);
  return (
    categories.find((group) =>
      group.words.some((word) => words.includes(word)),
    ) ?? other
  );
};

/** The same number for the same text, every time. */
const stableHash = (text: string) => {
  let hash = 0;
  for (let index = 0; index < text.length; index++)
    hash = (Math.imul(31, hash) + text.charCodeAt(index)) >>> 0;
  return hash;
};

export const getPlacePlaceholder = (
  place: Pick<Place, "category" | "name" | "coordinates">,
) => {
  const { placeholders } = getPlaceCategory(place.category);
  // Vary by place without changing on rerender, reopening, or hydration.
  const { lat, lng } = place.coordinates;
  const index = stableHash(`${place.name}:${lat}:${lng}`) % placeholders.length;
  return `/place-placeholders/${placeholders[index]}.svg`;
};
