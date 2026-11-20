"use client";

import FullCalendar, {
  type CalendarOptions,
  useCalendarController,
} from "@fullcalendar/react";
import timeGrid from "@fullcalendar/react/timegrid";
import interaction from "@fullcalendar/react/interaction";
import "@fullcalendar/react/skeleton.css";
import { weekCalendarTheme } from "./week-calendar-theme";

const plugins = [timeGrid, interaction];
// timeGridWeek aligns prev/next to the week start, so a day increment there
// snaps back to the same week. A day-based duration steps prev/next by 3 days.
const views = {
  timeGridRollingWeek: {
    type: "timeGrid",
    duration: { days: 7 },
    dateIncrement: { days: 3 },
  },
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
  const controller = useCalendarController();
  const buttons = controller.getButtonState();
  return (
    <div className="h-112 min-w-0 flex-none bg-white text-xs md:h-auto md:min-h-0 md:flex-1">
      {/*<div className="toolbar border-b border-neutral-200 bg-blue-500">*/}
      {/*  <button onClick={() => controller.today()}>{buttons.today.text}</button>*/}
      {/*  <div className="toolbar-title bg-red-500">Cheese</div>*/}
      {/*  <div className="toolbar-title">{controller?.view?.title}</div>*/}
      {/*  <div className="toolbar-title">{controller?.view?.title}</div>*/}
      {/*  <div className="toolbar-title">{controller?.view?.title}</div>*/}
      {/*</div>*/}
      <FullCalendar
        {...weekCalendarTheme}
        plugins={plugins}
        views={views}
        initialView="timeGridWeek"
        timeZone="UTC"
        now={localNow}
        firstDay={0}
        height="100%"
        allDaySlot={true}
        slotDuration="00:30"
        snapDuration="00:30"
        slotHeaderFormat={clockFormat}
        eventTimeFormat={clockFormat}
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        headerToolbar={false}
        nowIndicator
        eventInteractive
        borderless
        {...props}
      />
    </div>
  );
}