import type { Coordinates } from "./place";

export type UserInfo = {
  publicId: string;
  createdAt: string | null;
  updatedAt: string | null;
  email: string;
  name: string;
  image?: string | null;
  lastLocation?: Coordinates;
};
