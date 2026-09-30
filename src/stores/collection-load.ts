export type CollectionLoadState = "idle" | "loading" | "loaded" | "error";

export const fetchCollection = async <T>(path: string, key: string, label: string): Promise<T[]> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${label} fetch failed (${response.status})`);
  }

  const body = (await response.json()) as Record<string, unknown>;
  const value = body[key];
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${label} response`);
  }

  return value as T[];
};
