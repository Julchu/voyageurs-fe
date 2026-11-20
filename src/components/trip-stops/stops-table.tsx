"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTable } from "@tanstack/react-table";
import { Accordion } from "@base-ui/react/accordion";
import { useMediaQuery } from "@base-ui/react/unstable-use-media-query";
import { CaretDownIcon } from "@/components/ui/icons/caret-icons";
import { useStopDetails } from "@/hooks/use-stop-details";
import { EditorFooter } from "@/components/ui/editor-footer";
import {
  createStopColumns,
  features,
  mapHref,
  StopSummary,
} from "./stop-columns";

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
              <thead className="sticky top-0 z-20 bg-neutral-50 text-xs text-neutral-500">
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => (
                      <th
                        scope="col"
                        key={header.id}
                        className={`border-b border-neutral-200 px-4 py-3 font-medium ${header.column.id === "stop" ? "sticky left-0 z-10 bg-neutral-50" : ""}`}
                      >
                        <table.FlexRender header={header} />
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    {row.getAllCells().map((cell) =>
                      cell.column.id === "stop" ? (
                        <th
                          key={cell.id}
                          scope="row"
                          className="sticky left-0 z-10 border-r border-b border-neutral-100 bg-white px-4 py-5 font-normal"
                        >
                          <table.FlexRender cell={cell} />
                        </th>
                      ) : (
                        <td
                          key={cell.id}
                          className="border-b border-neutral-100 p-3"
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
              className="flex flex-col gap-3 p-4"
              aria-label={`Stops in ${trip.name}`}
            >
              {rows.map((row) => (
                <Accordion.Item
                  key={row.id}
                  value={row.id}
                  className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
                >
                  <Accordion.Header className="p-3">
                    <Accordion.Trigger className="group flex w-full cursor-pointer items-center gap-3 rounded p-1 text-left outline-blue-500 hover:bg-neutral-50">
                      <StopSummary stop={row.original.place} />
                      <CaretDownIcon
                        aria-hidden="true"
                        className="ml-auto size-5 shrink-0 fill-none stroke-neutral-500 transition-transform group-data-panel-open:rotate-180 motion-reduce:transition-none"
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="space-y-4 border-t border-neutral-100 p-4">
                    {row
                      .getAllCells()
                      .filter((cell) => cell.column.id !== "stop")
                      .map((cell) => (
                        <table.FlexRender key={cell.id} cell={cell} />
                      ))}
                    <Link
                      href={mapHref(row.original.place)}
                      className="inline-block text-sm font-medium text-blue-600 hover:underline"
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
          <Link
            href="/"
            className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white"
          >
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
