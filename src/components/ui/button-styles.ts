import { cn } from "cn";

export const pill =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

export const primaryButton = `${pill} bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 disabled:shadow-none disabled:hover:bg-blue-500`;
export const outlineButton = `${pill} border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50`;
export const dangerButton = `${pill} bg-red-50 text-red-600 hover:bg-red-100`;

/** Round icon-only button, e.g. calendar prev/next. */
export const circleButton =
  "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40";

/** Small caps heading, e.g. TRIP ORDER. */
export const sectionLabel =
  "text-xs font-semibold tracking-widest text-neutral-500 uppercase";

/** Rounded tag, e.g. "7 unique" or the open-hours stop name. */
export const badge =
  "inline-flex min-w-0 items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600";

/** Stop number circle (callers set the size). Unscheduled stops get a dashed outline. */
export const stopNumber = (scheduled: boolean) =>
  cn(
    "flex shrink-0 items-center justify-center rounded-full font-semibold",
    scheduled
      ? "bg-blue-500 text-white"
      : "border-[1.5px] border-dashed border-neutral-300 text-neutral-400",
  );
