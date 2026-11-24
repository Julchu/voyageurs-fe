"use client";

import { StopsTable } from "@/components/trip-stops/stops-table";
import { useHydrated } from "@/hooks/use-hydrated";

// The table shows the trip draft kept in localStorage, which the server can't see.
export default function StopsPage() {
  return useHydrated() ? <StopsTable /> : null;
}
