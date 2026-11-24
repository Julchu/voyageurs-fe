import Link from "next/link";
import { tableFeatures, type ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import type { StopDetails } from "@/types/trip-api";
import type { StopDetailsRow } from "@/hooks/use-stop-details";
import { badge } from "@/components/ui/button-styles";
import { CopyIcon, PinIcon } from "@/components/ui/icons/planner-icons";
import { StopDetailField } from "./stop-detail-fields";

type PlaceSummary = StopDetailsRow["place"];

export const features = tableFeatures({});
type StopColumn = ColumnDef<typeof features, StopDetailsRow> & {
  width: number;
};

export function mapHref(stop: PlaceSummary) {
  return `/?lat=${stop.coordinates.lat}&lng=${stop.coordinates.lng}`;
}

export function StopSummary({
  stop,
  count = 1,
  linkToMap = false,
}: {
  stop: PlaceSummary;
  count?: number;
  linkToMap?: boolean;
}) {
  return (
    <span className="min-w-0 flex-1 break-words">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {linkToMap ? (
          <Link
            href={mapHref(stop)}
            className="text-base font-bold text-neutral-900 hover:text-blue-600 hover:underline"
          >
            {stop.name}
          </Link>
        ) : (
          <span className="text-base font-bold text-neutral-900">
            {stop.name}
          </span>
        )}
        {count > 1 && (
          <span
            className={cn(badge, "px-2 py-0.5 text-xs")}
            title={`${count} stops in this trip are at this place`}
          >
            <CopyIcon aria-hidden="true" className="hidden size-3.5 md:block" />
            ×{count}
            <span className="hidden md:inline">in trip</span>
          </span>
        )}
      </span>
      <span className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
        <PinIcon
          aria-hidden="true"
          className="hidden size-4 shrink-0 md:block"
        />
        {stop.streetAddress || stop.areaAddress}
      </span>
    </span>
  );
}

export function createStopColumns(
  update: (row: StopDetailsRow, patch: Partial<StopDetails>) => void,
  isSaving: boolean,
): StopColumn[] {
  function detailColumn(
    field: keyof StopDetails,
    header: string,
    width: number,
  ): StopColumn {
    return {
      id: field,
      header,
      width,
      accessorFn: (row) => row.details[field],
      cell: ({ row }) => (
        <StopDetailField
          field={field}
          label={header}
          details={row.original.details}
          // TODO: Hint that new places get details after the trip is saved.
          disabled={isSaving || !row.original.editable}
          onChange={(patch) => update(row.original, patch)}
        />
      ),
    };
  }

  return [
    {
      id: "stop",
      header: "Stop",
      width: 280,
      accessorFn: (row) => row.place.name,
      cell: ({ row }) => (
        <StopSummary
          stop={row.original.place}
          count={row.original.count}
          linkToMap
        />
      ),
    },
    detailColumn("category", "Category", 208),
    detailColumn("type", "Type / cuisine", 208),
    detailColumn("details", "Details / extra", 288),
    detailColumn("notes", "Notes", 288),
    detailColumn("url", "Website", 256),
    detailColumn("reservations", "Reservation", 208),
    detailColumn("price", "Price / person", 176),
  ];
}
