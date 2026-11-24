import type { Place } from "@/types/place";
import type { TripDto, TripStopDto } from "./trip-api";

type Timestamps = Partial<Pick<TripDto, "createdAt" | "updatedAt">>;

/** A stop being edited. New stops only have a `clientId` until saved. */
export type TripStopDraft = Omit<
  TripStopDto,
  "publicId" | "placeId" | "position" | keyof Timestamps
> &
  Timestamps &
  Place & {
    clientId: string;
    publicId?: string;
    placeId?: string;
  };

/**
 * The trip being edited by the drawer and calendar. Stop order is the array
 * order. `version` is the server version this draft started from.
 */
export type TripDraft = Omit<
  TripDto,
  "publicId" | "version" | "stops" | "places" | "stopIdMap" | keyof Timestamps
> &
  Timestamps & {
    clientId: string;
    publicId?: string;
    version?: number;
    stops: TripStopDraft[];
  };
