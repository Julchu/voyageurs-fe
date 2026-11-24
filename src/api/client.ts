export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const errorOf = (body: unknown) =>
  body &&
  typeof body === "object" &&
  "error" in body &&
  typeof body.error === "string"
    ? body.error
    : undefined;

/** JSON from one of our `/api` routes. Throws ApiError with the route's `{ error }` message. */
export const apiJson = async <T>(path: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...init, headers });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      errorOf(body) ?? `Request failed (${response.status})`,
    );
  // shortcut: trusts our own BFF's response shape; parse here if the backend drifts.
  return body as T;
};
