import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-state";
import type { Coordinates, PlaceSearch } from "@/utils/interfaces";
import { useSearchStore } from "@/providers/search-store-provider";
import {
  createSearchBoxSessionToken,
  placeRecord,
  searchBoxRetrieve,
  searchBoxSuggest,
  type SearchSuggestion,
} from "@/components/map-box/utils/place-geocoding";
import { AddressCombobox, type AddressComboboxItem } from "./address-combobox";
import { DESKTOP_SEARCH_COLUMN } from "@/components/map-box/map-panel-layout";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
import { useShallow } from "zustand/react/shallow";

const MAPBOX_SUGGESTION_LIMIT = 10;

type AddressOption = AddressComboboxItem &
  (
    | { kind: "result"; mapboxId: string; sessionToken: string }
    | { kind: "recent"; search: PlaceSearch }
  );

export const AddressSearch = ({ proximity }: { proximity: Coordinates }) => {
  const { lat, lng } = proximity;
  const { searches, logSearch } = useSearchStore(
    useShallow(({ searches, logSearch }) => ({ searches, logSearch })),
  );
  const sessionRef = useRef<{
    token: string;
    startedAt: number;
    requests: number;
  } | null>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const retrieveAbortRef = useRef<AbortController | null>(null);

  // `query` drives the controlled input; `debounced` drives the fetch, so a
  // Search Box /suggest request fires per typing pause, not per keystroke.
  const [query, debounced, setQuery] = useDebouncedValue("", 300);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<{
    query: string;
    hits: SearchSuggestion[];
    sessionToken: string;
    error?: string;
  } | null>(null);
  const [retrieveStatus, setRetrieveStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [selected, setSelected] = useState<AddressOption | null>(null);

  useEffect(() => () => retrieveAbortRef.current?.abort(), []);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (!open || query.trim() !== trimmed || trimmed.length < 2) return;

    // Mapbox ends a session after retrieval, 180 seconds, or 50 suggestions.
    if (
      !sessionRef.current ||
      Date.now() - sessionRef.current.startedAt >= 170_000 ||
      sessionRef.current.requests >= 50
    ) {
      sessionRef.current = {
        token: createSearchBoxSessionToken(),
        startedAt: Date.now(),
        requests: 0,
      };
    }
    const session = sessionRef.current;
    session.requests += 1;

    const controller = new AbortController();
    suggestAbortRef.current = controller;
    void searchBoxSuggest(trimmed, {
      sessionToken: session.token,
      proximity: { lat, lng },
      types:
        "poi,address,street,place,locality,neighborhood,postcode,region,country",
      limit: MAPBOX_SUGGESTION_LIMIT,
      signal: controller.signal,
    })
      .then((hits) => {
        if (!controller.signal.aborted)
          setResults({ query: trimmed, hits, sessionToken: session.token });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResults({
            query: trimmed,
            hits: [],
            sessionToken: session.token,
            error: "Couldn’t load suggestions. Try typing again.",
          });
      });
    return () => controller.abort();
  }, [debounced, query, open, lat, lng]);

  const selectOption = (option: AddressOption) => {
    if (retrieveAbortRef.current && !retrieveAbortRef.current.signal.aborted)
      return;
    const searchQuery = query.trim();
    setSelected(option);
    setQuery(option.name);
    setOpen(false);
    setResults(null);
    setRetrieveStatus("idle");
    suggestAbortRef.current?.abort();

    if (option.kind === "recent") {
      openPlacePopup.openWithPayload(option.search);
      return;
    }

    const controller = new AbortController();
    retrieveAbortRef.current = controller;
    setRetrieveStatus("loading");

    sessionRef.current = null;
    void searchBoxRetrieve(option.mapboxId, {
      sessionToken: option.sessionToken,
      signal: controller.signal,
    }).then((place) => {
      if (controller.signal.aborted) return;
      retrieveAbortRef.current = null;
      setRetrieveStatus(place ? "idle" : "error");
      if (place) {
        openPlacePopup.openWithPayload(place);
        void logSearch({ ...placeRecord(place), query: searchQuery });
      }
    });
  };

  const trimmedQuery = query.trim();
  const pending =
    open && trimmedQuery.length >= 2 && results?.query !== trimmedQuery;
  const hits: AddressOption[] =
    results?.query === trimmedQuery
      ? results.hits.map((hit) => ({
          ...hit,
          id: hit.mapboxId,
          kind: "result",
          sessionToken: results.sessionToken,
        }))
      : [];
  const recentByPlace = new Map<string, PlaceSearch>();
  for (const search of searches) {
    const id =
      search.mapboxId ??
      `${search.name}:${search.coordinates.lat}:${search.coordinates.lng}`;
    if (!recentByPlace.has(id)) recentByPlace.set(id, search);
  }
  const recent: AddressOption[] = Array.from(recentByPlace, ([id, search]) => ({
    id: `recent:${id}`,
    name: search.name === "Saved place" ? search.query : search.name,
    streetAddress: search.streetAddress,
    areaAddress: search.areaAddress,
    kind: "recent",
    search,
  }));

  return (
    <div
      className={`pointer-events-auto absolute right-4 bottom-4 left-18 sm:right-auto ${DESKTOP_SEARCH_COLUMN}`}
    >
      <AddressCombobox
        query={query}
        results={trimmedQuery === "" ? recent : hits}
        selected={selected}
        open={open}
        loading={pending}
        disabled={retrieveStatus === "loading"}
        error={results?.query === trimmedQuery ? results.error : undefined}
        onQueryChange={(value) => {
          setQuery(value);
          setSelected(null);
          suggestAbortRef.current?.abort();
          setResults(null);
          setRetrieveStatus("idle");
          setOpen(true);
        }}
        onOpenChange={setOpen}
        onSelect={selectOption}
      />
      {retrieveStatus === "error" ? (
        <p
          role="status"
          className="absolute bottom-full mb-4 w-full rounded-xl bg-white p-2 text-base text-neutral-600 shadow"
        >
          Error searching that location.
        </p>
      ) : null}
    </div>
  );
};
