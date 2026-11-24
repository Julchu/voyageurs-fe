import "server-only";

/** The policy for every cookie the FE writes; override `path` to scope one. */
export const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;
