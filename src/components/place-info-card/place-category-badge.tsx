import type { MapboxCategoryId } from "@/types/mapbox";
import { getPlaceCategory } from "./utils/place-category";

export const PlaceCategoryBadge = ({
  category,
  className = "",
}: {
  category: MapboxCategoryId;
  className?: string;
}) => {
  const { badgeClassName } = getPlaceCategory(category);

  return (
    <span
      className={`inline-flex max-w-full rounded-full px-3 py-2 text-sm font-medium capitalize ${badgeClassName} ${className}`}
    >
      {category.replaceAll("_", " ").trim() || "Place"}
    </span>
  );
};
