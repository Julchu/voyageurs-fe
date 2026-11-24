import type { PlaceSearch, PlaceSearchInput } from "@/types/place";
import { ApiError, apiJson } from "./client";

export const listSearches = async () => {
  const searches = await apiJson<PlaceSearch[]>("/api/searches");
  if (!Array.isArray(searches)) throw new Error("Invalid search response");
  return searches;
};

/** The saved search, or null when the session has expired. */
export const postSearch = async (entry: PlaceSearchInput) => {
  const search = await apiJson<PlaceSearch>("/api/searches", {
    method: "POST",
    body: JSON.stringify(entry),
  }).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  });
  if (search && !search.publicId) throw new Error("Invalid search response");
  return search;
};
