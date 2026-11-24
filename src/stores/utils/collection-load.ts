export type CollectionLoadState = "idle" | "loading" | "loaded" | "error";

/** Collections load once, when the server render couldn't load them. */
export const shouldFetchCollection = (state: CollectionLoadState) =>
  state === "idle";
