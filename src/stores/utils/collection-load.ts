export type CollectionLoadState = "idle" | "loading" | "loaded" | "error";

/** Failed loads can be retried; loaded and in-flight requests are skipped. */
export const shouldFetchCollection = (state: CollectionLoadState) =>
  state === "idle" || state === "error";

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
