import { MapTimeEnum, MapTimeType } from "@/utils/interfaces";

/** Local-time hour boundaries (24h clock, inclusive start / exclusive end). */
const DAWN_START = 5;
const DAY_START = 7;
const DUSK_START = 18;
const NIGHT_START = 20;

const localHour = (date: Date) =>
  date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

/** Classify the user's current local time into map lighting periods. */
export const mapTimeFromDate = (date: Date = new Date()): MapTimeType => {
  const hour = localHour(date);

  if (hour >= NIGHT_START || hour < DAWN_START) return MapTimeEnum.NIGHT;
  if (hour < DAY_START) return MapTimeEnum.DAWN;
  if (hour < DUSK_START) return MapTimeEnum.DAY;
  return MapTimeEnum.DUSK;
};