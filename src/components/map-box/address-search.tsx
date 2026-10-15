import { useEffect, useId, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-state";
import type { Coordinates, Place } from "@/utils/interfaces";
import type { SearchSuggestion } from "@/components/map-box/utils/place-geocoding";
import {
  createGoogleSessionToken,
  googleRetrieve,
  googleSuggest,
} from "@/components/map-box/utils/google-places";
import { useSearchStore } from "@/providers/search-store-provider";

export const AddressSearch = ({
  onSelect,
  proximity,
}: {
  onSelect: (place: Place, query: string, log: boolean) => void;
  proximity: Coordinates;
}) => {
  const listId = useId();
  const searches = useSearchStore(({ searches }) => searches);
  const sessionTokenRef = useRef(createGoogleSessionToken());
  const retrieveAbortRef = useRef<AbortController | null>(null);

  const renewSession = () => {
    sessionTokenRef.current = createGoogleSessionToken();
  };

  // `query` drives the controlled input; `debounced` drives the fetch, so a
  // Search Box /suggest request fires per typing pause, not per keystroke.
  const [query, debounced, setQuery] = useDebouncedValue("", 300);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<SearchSuggestion[]>([]);
  const [retrieving, setRetrieving] = useState(false);

  useEffect(() => () => retrieveAbortRef.current?.abort(), []);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed.length < 2) return;

    const controller = new AbortController();
    void googleSuggest(trimmed, {
      sessionToken: sessionTokenRef.current,
      proximity,
      limit: 5,
      signal: controller.signal,
    }).then((next) => setHits(next));
    return () => controller.abort();
  }, [debounced, proximity]);

  const selectSuggestion = (hit: SearchSuggestion) => {
    const searchQuery = query.trim();
    setQuery(hit.name);
    setOpen(false);
    retrieveAbortRef.current?.abort();
    const controller = new AbortController();
    retrieveAbortRef.current = controller;
    setRetrieving(true);

    void googleRetrieve(hit.mapboxId, {
      sessionToken: sessionTokenRef.current,
      signal: controller.signal,
    }).then((place) => {
      if (controller.signal.aborted) return;
      setRetrieving(false);
      renewSession();
      if (place) onSelect(place, searchQuery, true);
    });
  };

  const recent = searches.slice(0, 6);
  const trimmedQuery = query.trim();
  const showRecent = open && trimmedQuery.length < 2 && recent.length > 0;
  const showHits = open && trimmedQuery.length >= 2;
  const pending = trimmedQuery !== debounced.trim();

  return (
    <div className="pointer-events-auto absolute top-16 left-1/2 h-6 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2">
      <input
        value={query}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-busy={retrieving}
        aria-label="Search address"
        placeholder="Search an address"
        disabled={retrieving}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        className="w-full rounded-md bg-white px-4 py-2 text-sm text-neutral-950 shadow outline-none disabled:opacity-70"
      />
      {showRecent || showHits ? (
        <ul
          id={listId}
          className="mt-2 max-h-72 overflow-y-auto rounded-md bg-white p-1 text-sm text-neutral-950 shadow"
        >
          {showRecent
            ? recent.map((search) => (
                <li key={search.publicId}>
                  <button
                    type="button"
                    className="w-full rounded-md px-3 py-2 text-left hover:bg-neutral-100"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setQuery(search.name);
                      setOpen(false);
                      onSelect(search, search.query, false);
                    }}
                  >
                    <span className="block truncate">{search.name}</span>
                    <span className="block truncate text-xs text-neutral-500">
                      {search.streetAddress || search.query}
                    </span>
                  </button>
                </li>
              ))
            : null}
          {showHits && pending ? (
            <li className="px-3 py-2 text-neutral-500">Searching</li>
          ) : null}
          {showHits && !pending && hits.length === 0 ? (
            <li className="px-3 py-2 text-neutral-500">No matches</li>
          ) : null}
          {showHits && !pending
            ? hits.map((hit) => (
                <li key={hit.mapboxId}>
                  <button
                    type="button"
                    className="w-full rounded-md px-3 py-2 text-left hover:bg-neutral-100 disabled:opacity-50"
                    disabled={retrieving}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSuggestion(hit)}
                  >
                    <span className="block truncate">{hit.name}</span>
                    <span className="block truncate text-xs text-neutral-500">
                      {hit.streetAddress || hit.areaAddress}
                    </span>
                  </button>
                </li>
              ))
            : null}
        </ul>
      ) : null}
    </div>
  );
};
