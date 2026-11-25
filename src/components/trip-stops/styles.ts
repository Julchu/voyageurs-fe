/** Table cells read as plain text until hovered or focused; phone cards show filled boxes. */
export const stopInput =
  "min-h-10 w-full min-w-0 rounded-xl border border-transparent bg-transparent px-3 py-2 text-base font-medium text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-400 hover:border-neutral-200 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-50 max-md:min-h-12 max-md:rounded-2xl max-md:border-neutral-200 max-md:bg-neutral-50 md:text-sm";

/** Reservation pill colors, keyed by the select's value. The dot is a ::before. */
export const reservationTone = {
  "": "bg-neutral-100 text-neutral-700 before:bg-neutral-400",
  needs_reservation: "bg-amber-50 text-amber-700 before:bg-amber-500",
  booked: "bg-emerald-50 text-emerald-700 before:bg-emerald-500",
};

export const reservationLabel = {
  "": "Not needed",
  needs_reservation: "Needed",
  booked: "Booked",
};

/** A small rounded tag; add a reservationTone for a colored dot. */
export const chip =
  "relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold before:size-2 before:rounded-full";
