import { useEffect, useId, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-state";
import type { Coordinates, Place } from "@/utils/interfaces";
import {
  createSearchBoxSessionToken,
  searchBoxRetrieve,
  searchBoxSuggest,
  type SearchSuggestion,
} from "@/components/map-box/utils/place-geocoding";
import { useSearchStore } from "@/providers/search-store-provider";
import {
  googleCreateSessionToken,
  googleResolvePlace,
  googleRetrieve,
  googleSuggest,
} from "@/components/google-map/utils/google-places";
import { MapSearchIcon } from "@/components/ui/icons/map-icons";
import { Input } from "@base-ui/react/input";
import { Button } from "@base-ui/react";
import { DESKTOP_SEARCH_COLUMN } from "@/components/map-box/map-panel-layout";

const SEARCH_RESULT_LIMIT = 3;

export const AddressSearch = ({
  onSelect,
  proximity,
  provider = "mapbox",
}: {
  onSelect: (place: Place, query: string, log: boolean) => void;
  proximity: Coordinates;
  provider?: "mapbox" | "google";
}) => {
  const listId = useId();
  const listRef = useRef<HTMLUListElement | null>(null);
  const searches = useSearchStore(({ searches }) => searches);
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
    error?: string;
  } | null>(null);
  const [retrieving, setRetrieving] = useState(false);
  const [retrieveError, setRetrieveError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => () => retrieveAbortRef.current?.abort(), []);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (!open || query.trim() !== trimmed || trimmed.length < 2) return;

    // Mapbox ends a session after retrieval, 180 seconds, or 50 suggestions.
    if (
      !sessionRef.current ||
      (provider === "mapbox" &&
        (Date.now() - sessionRef.current.startedAt >= 170_000 ||
          sessionRef.current.requests >= 50))
    ) {
      sessionRef.current = {
        token:
          provider === "google"
            ? googleCreateSessionToken()
            : createSearchBoxSessionToken(),
        startedAt: Date.now(),
        requests: 0,
      };
    }
    const session = sessionRef.current;
    session.requests += 1;

    const controller = new AbortController();
    suggestAbortRef.current = controller;
    const suggest = provider === "google" ? googleSuggest : searchBoxSuggest;
    void suggest(trimmed, {
      sessionToken: session.token,
      proximity,
      types:
        "poi,address,street,place,locality,neighborhood,postcode,region,country",
      limit: SEARCH_RESULT_LIMIT,
      signal: controller.signal,
    })
      .then((hits) => {
        if (!controller.signal.aborted) setResults({ query: trimmed, hits });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResults({
            query: trimmed,
            hits: [],
            error: "Couldn’t load suggestions. Try typing again.",
          });
      });
    return () => controller.abort();
  }, [debounced, query, open, proximity, provider]);

  const selectSuggestion = (hit: SearchSuggestion) => {
    const session = sessionRef.current;
    if (!session) return;
    const searchQuery = query.trim();
    setQuery(hit.name);
    setOpen(false);
    setActiveIndex(-1);
    setResults(null);
    setRetrieveError(false);
    suggestAbortRef.current?.abort();
    retrieveAbortRef.current?.abort();
    const controller = new AbortController();
    retrieveAbortRef.current = controller;
    setRetrieving(true);

    const retrieve = provider === "google" ? googleRetrieve : searchBoxRetrieve;
    void retrieve(hit.mapboxId, {
      sessionToken: session.token,
      attributeSets: ["photos"],
      signal: controller.signal,
    }).then((place) => {
      if (controller.signal.aborted) return;
      setRetrieving(false);
      sessionRef.current = null;
      if (place) onSelect(place, searchQuery, true);
      else setRetrieveError(true);
    });
  };

  const recent = searches.slice(0, SEARCH_RESULT_LIMIT);
  const trimmedQuery = query.trim();
  const showRecent = open && trimmedQuery.length < 2 && recent.length > 0;
  const showHits = open && trimmedQuery.length >= 2;
  const pending = results?.query !== trimmedQuery;
  const hits = pending ? [] : results.hits.slice(0, SEARCH_RESULT_LIMIT);
  const visibleCount = showRecent ? recent.length : showHits ? hits.length : 0;

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [showRecent, showHits, results, searches]);

  useEffect(() => {
    const list = listRef.current;
    const option = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !option) return;

    const bottom = option.offsetTop + option.offsetHeight;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = bottom - list.clientHeight;
  }, [activeIndex, showRecent, showHits, results, searches]);

  const selectRecent = (index: number) => {
    const search = recent[index];
    if (!search) return;
    setQuery(
      search.mapboxId?.startsWith("google:") ? search.query : search.name,
    );
    setOpen(false);
    setActiveIndex(-1);
    setResults(null);
    setRetrieveError(false);
    if (provider !== "google") {
      onSelect(search, search.query, false);
      return;
    }
    retrieveAbortRef.current?.abort();
    const controller = new AbortController();
    retrieveAbortRef.current = controller;
    setRetrieving(true);
    void googleResolvePlace(search, controller.signal).then((place) => {
      if (controller.signal.aborted) return;
      setRetrieving(false);
      if (place) onSelect(place, search.query, false);
      else setRetrieveError(true);
    });
  };

  return (
    <div
      className={`pointer-events-auto absolute right-4 bottom-4 left-18 sm:right-auto ${DESKTOP_SEARCH_COLUMN}`}
    >
      <div
        className={
          "flex flex-row gap-2 rounded-lg bg-white px-2 shadow has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-neutral-100 has-[:disabled]:opacity-70"
        }
      >
        <div className={"flex shrink-0 items-center"}>
          <MapSearchIcon className={"h-6 w-6 stroke-blue-500"} />
        </div>
        <Input
          className="h-10 w-full min-w-0 pr-4 text-base text-neutral-950 outline-none"
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showRecent || showHits}
          aria-controls={listId}
          aria-activedescendant={
            activeIndex >= 0 && activeIndex < visibleCount
              ? `${listId}-${activeIndex}`
              : undefined
          }
          aria-busy={retrieving || (showHits && pending)}
          aria-label="Search places and addresses"
          placeholder="Search places and addresses"
          disabled={retrieving}
          onChange={(event) => {
            setQuery(event.target.value);
            suggestAbortRef.current?.abort();
            setResults(null);
            setRetrieveError(false);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setActiveIndex(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setActiveIndex(-1);
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              const count =
                trimmedQuery.length < 2 ? recent.length : hits.length;
              if (count)
                setActiveIndex((index) =>
                  event.key === "ArrowUp"
                    ? index < 0 || index >= count
                      ? 0
                      : (index + 1) % count
                    : index < 0 || index >= count
                      ? count - 1
                      : (index - 1 + count) % count,
                );
            } else if (event.key === "Enter" && open && visibleCount) {
              event.preventDefault();
              const index = Math.max(0, activeIndex);
              if (showRecent) selectRecent(index);
              else if (hits[index]) selectSuggestion(hits[index]);
            }
          }}
        />
      </div>

      <div className="absolute bottom-full mb-2 flex w-full flex-col gap-2">
        {showRecent || showHits ? (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Location suggestions"
            className={
              "relative flex flex-col gap-1 overflow-hidden rounded-lg bg-white p-1 text-base text-neutral-950 shadow"
            }
          >
            {showRecent
              ? recent
                  .map((search, index) => (
                    <li
                      key={
                        search.publicId ??
                        search.clientId ??
                        `${search.name}:${index}`
                      }
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      className="group"
                    >
                      <Button
                        tabIndex={-1}
                        className={`flex h-10 w-full flex-col justify-center rounded-lg pl-4 text-left tracking-widest group-hover:bg-blue-500 group-hover:text-white ${activeIndex === index ? "bg-blue-500 text-white" : ""}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectRecent(index)}
                      >
                        <span className="block w-full truncate">
                          {search.mapboxId?.startsWith("google:")
                            ? search.query
                            : search.name}
                        </span>
                        <span
                          className={`block w-full truncate text-xs group-hover:text-white ${activeIndex === index ? "text-white" : "text-neutral-500"}`}
                        >
                          {search.streetAddress || search.query}
                        </span>
                      </Button>
                    </li>
                  ))
                  .reverse()
              : null}
            {showHits && pending ? (
              <li className="flex min-h-10 items-center px-3 py-2 text-neutral-500">
                Searching
              </li>
            ) : null}
            {showHits && !pending && hits.length === 0 ? (
              <li
                role="presentation"
                className="flex min-h-10 items-center px-3 py-2 text-neutral-500"
              >
                {results?.error ?? "No matches"}
              </li>
            ) : null}
            {showHits && !pending
              ? hits
                  .map((hit, index) => (
                    <li
                      key={hit.mapboxId}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={activeIndex === index}
                    >
                      <Button
                        tabIndex={-1}
                        className={`flex h-10 w-full flex-col justify-center px-3 text-left hover:bg-neutral-100 disabled:opacity-50 ${activeIndex === index ? "bg-neutral-100" : ""}`}
                        disabled={retrieving}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSuggestion(hit)}
                      >
                        <span className="block w-full truncate">
                          {hit.name}
                        </span>
                        <span className="block w-full truncate text-xs text-neutral-500 hover:text-white">
                          {[hit.streetAddress, hit.areaAddress]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </Button>
                    </li>
                  ))
                  .reverse()
              : null}
          </ul>
        ) : null}
        {retrieveError ? (
          <p
            role="status"
            className="rounded-lg bg-white p-3 text-base text-neutral-600 shadow"
          >
            Couldn’t load that location. Try selecting it again.
          </p>
        ) : null}
      </div>
    </div>
  );
};