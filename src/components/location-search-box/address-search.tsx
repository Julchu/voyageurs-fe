import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { flyTo } from "@/components/map-box/map-actions";
import { useMapStore } from "@/components/map-box/map-store";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { PlaceSearch } from "@/types/place";
import type { SearchSuggestion } from "@/types/mapbox";
import { useSearches } from "@/hooks/use-searches";
import {
  createSearchBoxSessionToken,
  searchBoxRetrieve,
  searchBoxSuggest,
} from "@/components/map-box/utils/mapbox-search-box";
import { placeIdentity } from "@/utils/place-identity";
import { uniqueBy } from "@/utils/unique-by";
import {
  AddressCombobox,
  type AddressComboboxItem,
  MIN_QUERY_LENGTH,
} from "./address-combobox";
import { DESKTOP_SEARCH_COLUMN } from "@/components/map-box/map-panel-layout";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";

const MAPBOX_SUGGESTION_LIMIT = 10;
const SUGGEST_DEBOUNCE_MS = 300;
const SUGGEST_TYPES =
  "poi,address,street,place,locality,neighborhood,postcode,region,country";
// Mapbox ends a session after retrieval, 180 seconds, or 50 suggestions.
const SESSION_MAX_AGE_MS = 170_000;
const SESSION_MAX_REQUESTS = 50;
// Placeholder name for a search saved without a place name. Show the query instead.
const SAVED_PLACE_NAME = "Saved place";

type AddressOption = AddressComboboxItem &
  (
    | { kind: "result"; mapboxId: string; sessionToken: string }
    | { kind: "recent"; search: PlaceSearch }
  );

export const AddressSearch = () => {
  const map = useMapStore((state) => state.map);
  const { searches, logSearch } = useSearches();
  const sessionRef = useRef<{
    token: string;
    startedAt: number;
    requests: number;
  } | null>(null);
  const retrieveAbortRef = useRef<AbortController | null>(null);

  // `query` drives the controlled input; `debounced` drives the fetch, so a
  // Search Box /suggest request fires per typing pause, not per keystroke.
  const [query, debounced, setQuery] = useDebouncedValue(
    "",
    SUGGEST_DEBOUNCE_MS,
  );
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
    if (!open || query.trim() !== trimmed || trimmed.length < MIN_QUERY_LENGTH)
      return;

    if (
      !sessionRef.current ||
      Date.now() - sessionRef.current.startedAt >= SESSION_MAX_AGE_MS ||
      sessionRef.current.requests >= SESSION_MAX_REQUESTS
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
    void searchBoxSuggest(trimmed, {
      sessionToken: session.token,
      // Read at request time so panning the map doesn't re-fire suggestions.
      proximity: map?.getCenter(),
      types: SUGGEST_TYPES,
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
  }, [debounced, query, open, map]);

  const selectOption = (option: AddressOption) => {
    if (retrieveStatus === "loading") return;
    const searchQuery = query.trim();
    setSelected(option);
    setQuery(option.name);
    setOpen(false);
    setResults(null);
    setRetrieveStatus("idle");

    if (option.kind === "recent") {
      openPlacePopup.openWithPayload(option.search);
      flyTo(map, option.search.coordinates);
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
      setRetrieveStatus(place ? "idle" : "error");
      if (place) {
        openPlacePopup.openWithPayload(place);
        flyTo(map, place.coordinates);
        void logSearch({ ...place, query: searchQuery });
      }
    });
  };

  const trimmedQuery = query.trim();
  const pending =
    open &&
    trimmedQuery.length >= MIN_QUERY_LENGTH &&
    results?.query !== trimmedQuery;
  const hits: AddressOption[] =
    results?.query === trimmedQuery
      ? results.hits.map((hit) => ({
          ...hit,
          id: hit.mapboxId,
          kind: "result",
          sessionToken: results.sessionToken,
        }))
      : [];
  const recent = uniqueBy(searches, placeIdentity).map(
    (search): AddressOption => ({
      id: `recent:${placeIdentity(search)}`,
      name: search.name === SAVED_PLACE_NAME ? search.query : search.name,
      streetAddress: search.streetAddress,
      areaAddress: search.areaAddress,
      kind: "recent",
      search,
    }),
  );

  return (
    <div
      className={cn(
        "pointer-events-auto absolute right-4 bottom-4 left-18 sm:right-auto",
        DESKTOP_SEARCH_COLUMN,
      )}
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
