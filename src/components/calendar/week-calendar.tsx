"use client";

import FullCalendar, { type CalendarOptions } from "@fullcalendar/react";
import timeGrid from "@fullcalendar/react/timegrid";
import interaction from "@fullcalendar/react/interaction";
import "@fullcalendar/react/skeleton.css";
import { weekCalendarTheme } from "./week-calendar-theme";

const plugins = [timeGrid, interaction];
// timeGridWeek aligns prev/next to the week start, so a day increment there
// snaps back to the same week. A day-based duration steps prev/next by 3 days.
const rolling = (days: number) => ({
  type: "timeGrid",
  duration: { days },
  dateIncrement: { days: 3 },
});
const views = {
  timeGridRolling3: rolling(3),
  timeGridRolling4: rolling(4),
  timeGridRolling7: rolling(7),
};
// The calendar runs in UTC as a neutral wall clock, so the real "now" would
// read as UTC time (hours ahead/behind). Re-express local wall-clock time as
// UTC so today's highlight and the now indicator match the user's clock.
const localNow = () => {
  const d = new Date();
  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
    ),
  );
};
const clockFormat = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as const;

export function WeekCalendar(props: CalendarOptions) {
  return (
    <div className="min-h-0 min-w-0 flex-1 bg-white text-xs">
      <FullCalendar
        {...weekCalendarTheme}
        plugins={plugins}
        views={views}
        initialView="timeGridWeek"
        timeZone="UTC"
        now={localNow}
        firstDay={0}
        height="100%"
        allDaySlot={false}
        slotDuration="00:30"
        snapDuration="00:30"
        slotHeaderFormat={clockFormat}
        eventTimeFormat={clockFormat}
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        headerToolbar={false}
        longPressDelay={250}
        nowIndicator
        eventInteractive
        borderless
        {...props}
      />
    </div>
  );
}
