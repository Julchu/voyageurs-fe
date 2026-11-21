import Link from "next/link";
import { tableFeatures, type ColumnDef } from "@tanstack/react-table";
import type { StopDetails } from "@/types/trip-api";
import type { StopDetailsRow } from "@/hooks/use-stop-details";
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
  linkToMap = false,
}: {
  stop: PlaceSummary;
  linkToMap?: boolean;
}) {
  return (
    <span className="min-w-0 flex-1 break-words">
      {linkToMap ? (
        <Link
          href={mapHref(stop)}
          className="font-medium text-neutral-800 hover:text-blue-600 hover:underline"
        >
          {stop.name}
        </Link>
      ) : (
        <span className="block text-sm font-medium text-neutral-800">
          {stop.name}
        </span>
      )}
      <span className="mt-1 block text-xs leading-relaxed text-neutral-400">
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
      width: 240,
      accessorFn: (row) => row.place.name,
      cell: ({ row }) => <StopSummary stop={row.original.place} linkToMap />,
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
