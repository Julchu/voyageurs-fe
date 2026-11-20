// Display helpers for trip dates. Dates are local trip time, never browser time.
export const dateDays = (start: string, end: string): string[] => {
  const first = Date.parse(`${start}T00:00:00Z`);
  const last = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(first) || !Number.isFinite(last) || last < first)
    return [];
  const count = Math.floor((last - first) / 86_400_000) + 1;
  if (count > 366) return [];
  return Array.from({ length: count }, (_, index) =>
    new Date(first + index * 86_400_000).toISOString().slice(0, 10),
  );
};

export const timeLabel = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
