"use client";

import { TripCalendar } from "@/components/calendar/trip-calendar";
import { useHydrated } from "@/hooks/use-hydrated";

// The calendar shows the trip draft kept in localStorage, which the server can't see.
export default function CalendarPage() {
  return useHydrated() ? <TripCalendar /> : null;
}
