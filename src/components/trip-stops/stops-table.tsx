"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTable } from "@tanstack/react-table";
import { Accordion } from "@base-ui/react/accordion";
import { useMediaQuery } from "@base-ui/react/unstable-use-media-query";
import { cn } from "cn";
import { CaretDownIcon } from "@/components/ui/icons/caret-icons";
import { CloudCheckIcon } from "@/components/ui/icons/planner-icons";
import { type StopDetailsRow, useStopDetails } from "@/hooks/use-stop-details";
import { EditorFooter } from "@/components/ui/editor-footer";
import { badge, primaryButton } from "@/components/ui/button-styles";
import {
  createStopColumns,
  features,
  mapHref,
  StopSummary,
} from "./stop-columns";
import { chip, reservationLabel, reservationTone } from "./styles";

export function StopsTable() {
  const {
    trip,
    rows: data,
    edit,
    isDirty,
    isSaving,
    canSave,
    save,
    reset,
  } = useStopDetails();
  const [isEditing, setIsEditing] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)", {
    defaultMatches: false,
  });
  const columns = useMemo(
    () => createStopColumns(edit, isSaving),
    [edit, isSaving],
  );
  const table = useTable({
    features,
    data,
    columns,
    getRowId: (row) => row.key,
  });
  const rows = table.getRowModel().rows;

  return (
    <section
      onFocusCapture={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.matches("input, textarea, select")
        )
          setIsEditing(true);
      }}
      aria-label="Trip stop details"
      className="flex h-full min-h-0 flex-col bg-white text-neutral-900"
    >
      <header className="flex shrink-0 flex-wrap items-center gap-3 px-4 pt-5 pb-4 md:px-8 md:py-6">
        <h1 className="text-3xl font-bold">Stops</h1>
        <span className={badge}>{data.length} unique</span>
        {canSave && !isDirty && !isSaving && (
          <p className="ml-auto flex items-center gap-2 text-sm text-neutral-500">
            <CloudCheckIcon
              aria-hidden="true"
              className="size-5 text-emerald-500"
            />
            Saved
          </p>
        )}
        {/* TODO: "Search stops" filter input. */}
      </header>
      {trip?.stops.length ? (
        <div className="min-h-0 min-w-0 flex-1 [scrollbar-gutter:stable] overflow-x-hidden overflow-y-auto overscroll-none md:overflow-auto">
          {isDesktop ? (
            <table
              className="w-full table-fixed border-separate border-spacing-0 text-left text-sm"
              style={{
                minWidth: columns.reduce(
                  (sum, column) => sum + column.width,
                  0,
                ),
              }}
            >
              <caption className="sr-only">
                Edit details for stops in {trip.name}
              </caption>
              <colgroup>
                {columns.map((column) => (
                  <col key={column.id} style={{ width: column.width }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-20 bg-neutral-50 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => (
                      <th
                        scope="col"
                        key={header.id}
                        className={cn(
                          "border-y border-neutral-100 px-5 py-4 font-semibold",
                          header.column.id === "stop" &&
                            "sticky left-0 z-10 border-r bg-neutral-50 pl-8",
                        )}
                      >
                        <table.FlexRender header={header} />
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {row.getAllCells().map((cell) =>
                      cell.column.id === "stop" ? (
                        <th
                          key={cell.id}
                          scope="row"
                          className="sticky left-0 z-10 border-r border-b border-neutral-100 bg-white py-4 pr-5 pl-8 font-normal shadow-[6px_0_8px_-8px_rgb(0_0_0/0.2)]"
                        >
                          <table.FlexRender cell={cell} />
                        </th>
                      ) : (
                        <td
                          key={cell.id}
                          className="border-b border-neutral-100 px-2 py-3"
                        >
                          <table.FlexRender cell={cell} />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Accordion.Root
              key={trip.publicId ?? trip.clientId}
              multiple
              onValueChange={(value) => setIsEditing(value.length > 0)}
              className="flex flex-col gap-3 px-4 pb-4"
              aria-label={`Stops in ${trip.name}`}
            >
              {rows.map((row) => (
                <Accordion.Item
                  key={row.id}
                  value={row.id}
                  className="overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-shadow data-open:border-blue-200 data-open:ring-4 data-open:ring-blue-50"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left outline-blue-500">
                      <span className="min-w-0 flex-1">
                        <StopSummary
                          stop={row.original.place}
                          count={row.original.count}
                        />
                        <RowChips details={row.original.details} />
                      </span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors group-hover:bg-neutral-50 group-data-panel-open:bg-blue-50">
                        <CaretDownIcon
                          aria-hidden="true"
                          className="size-5 fill-none stroke-neutral-500 transition-transform group-data-panel-open:rotate-180 group-data-panel-open:stroke-blue-500 motion-reduce:transition-none"
                        />
                      </span>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="space-y-5 border-t border-neutral-100 px-5 pt-4 pb-5">
                    {row
                      .getAllCells()
                      .filter((cell) => cell.column.id !== "stop")
                      .map((cell) => (
                        <table.FlexRender key={cell.id} cell={cell} />
                      ))}
                    <Link
                      href={mapHref(row.original.place)}
                      className="inline-block text-sm font-semibold text-blue-600 hover:underline"
                    >
                      View on map
                    </Link>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="font-medium">Your next trip starts with a place.</p>
          <p className="max-w-sm text-sm text-neutral-500">
            Add stops from the map, or choose a saved trip from the trip drawer.
          </p>
          <Link href="/" className={cn(primaryButton, "mt-2")}>
            Explore the map
          </Link>
        </div>
      )}
      <EditorFooter
        isDirty={isDirty}
        isEditing={isEditing}
        isSaving={isSaving}
        canSave={canSave}
        onSave={() => void save().then(() => setIsEditing(false))}
        onReset={() => {
          reset();
          setIsEditing(false);
        }}
      />
    </section>
  );
}

/** Type and reservation at a glance, on collapsed phone cards. */
function RowChips({ details }: { details: StopDetailsRow["details"] }) {
  const reservation = details.reservations ?? "";
  return (
    <span className="mt-3 flex flex-wrap gap-2 group-data-panel-open:hidden">
      {details.type && (
        <span
          className={cn(chip, "bg-neutral-100 text-neutral-600 before:hidden")}
        >
          {details.type}
        </span>
      )}
      <span className={cn(chip, reservationTone[reservation])}>
        {reservationLabel[reservation]}
      </span>
    </span>
  );
}
