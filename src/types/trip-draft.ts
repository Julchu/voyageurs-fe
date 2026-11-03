import type { Place } from "@/utils/interfaces";
import type { TripDto, TripStopDto } from "./trip-api";

type DraftTimestamps = Partial<Pick<TripDto, "createdAt" | "updatedAt">>;

export type TripStopDraft = Omit<
  TripStopDto,
  "publicId" | keyof DraftTimestamps
> &
  DraftTimestamps &
  Place & {
    clientId: string;
    publicId?: string;
  };

export type TripDraft = Omit<
  TripDto,
  "publicId" | "version" | "stops" | keyof DraftTimestamps
> &
  DraftTimestamps & {
    clientId: string;
    publicId?: string;
    version?: number;
    stops: TripStopDraft[];
  };
