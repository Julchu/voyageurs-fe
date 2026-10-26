export type CollectionLoadState = "idle" | "loading" | "loaded" | "error";

export const loadStateFromServer = (
  serverLoaded: boolean,
): CollectionLoadState => (serverLoaded ? "loaded" : "idle");

/** Skip when a fetch is already in flight or finished. Error stays retryable. */
export const nextLoadStateForFetch = (
  loadState: CollectionLoadState,
): { shouldFetch: true; loadState: "loading" } | { shouldFetch: false } => {
  if (loadState === "loading" || loadState === "loaded") {
    return { shouldFetch: false };
  }
  return { shouldFetch: true, loadState: "loading" };
};

export const fetchCollection = async <T>(
  path: string,
  errorLabel: string,
): Promise<T[]> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${errorLabel} fetch failed (${response.status})`);
  }

  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error(`Invalid ${errorLabel} response`);
  }

  return body as T[];
};