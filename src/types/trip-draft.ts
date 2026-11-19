import type { Place } from "@/utils/interfaces";

/** A drawer stop. New stops only have a clientId until the trip is saved. */
export type TripStopDraft = Place & {
  clientId: string;
  publicId?: string;
  visited?: boolean;
};

/** The drawer's local copy of a trip: its name and ordered stops. Pages keep their own drafts. */
export type TripDraft = {
  clientId: string;
  publicId?: string;
  version?: number;
  name: string;
  stops: TripStopDraft[];
};
