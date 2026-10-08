import { Place } from "@/utils/interfaces";
import { useTripStore } from "@/providers/trip-store-provider";

export const SelectedAddressPopup = ({
  selected,
  setSelected,
}: {
  selected: Place | null;
  setSelected: (selectedPlaceDraft: Place | null) => void;
}) => {
  const addStop = useTripStore(({ addStop }) => addStop);

  if (!selected) return null;

  return (
    <div className="absolute bottom-20 left-1/2 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl bg-white/95 p-3 text-neutral-950 shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{selected.name}</p>
          <p className="truncate text-xs text-neutral-500">
            {selected.address || "No address yet"}
          </p>
        </div>
        <button
          type="button"
          className="text-xs text-neutral-500"
          onClick={() => setSelected(null)}
        >
          Close
        </button>
      </div>
      <button
        type="button"
        className="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white"
        onClick={() => {
          addStop(selected);
          setSelected(null);
        }}
      >
        Add to trip
      </button>
    </div>
  );
};