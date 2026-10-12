import { Place } from "@/utils/interfaces";
import { useTripStore } from "@/providers/trip-store-provider";
import { CurrentLocationIcon } from "@/components/ui/icons/map-pins";

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
    <div className="absolute bottom-20 left-1/2 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 rounded-md bg-white p-3 text-neutral-950 shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{selected.name}</p>
          <p className="flex flex-row items-center gap-1 truncate text-xs text-neutral-500">
            <CurrentLocationIcon
              className={"h-3 w-3 fill-none stroke-blue-500"}
            />
            {selected.streetAddress || "No address yet"}
          </p>
          <p className="truncate text-xs text-neutral-500">
            {selected.areaAddress || "No address yet"}
          </p>
          <p className="truncate text-xs text-neutral-500">
            {selected.category || "No category"}
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