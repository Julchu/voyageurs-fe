import { useMemo } from "react";
import type { TripDto } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import { tripChanges } from "@/utils/trip-sync";

export const useTripDirty = (draft?: TripDraft, saved?: TripDto): boolean =>
  useMemo(() => {
    if (!draft) return false;
    const changes = tripChanges(draft, saved);
    return changes.name !== undefined || changes.stops !== undefined;
  }, [draft, saved]);
