// Google address-search alternative, saved for later.
// Uncomment this file and swap AddressSearch for GoogleAddressSearch in map.tsx.
// Keep the Google API routes and GOOGLE_MAPS_API_KEY configured when enabling it.
// Restore the Google credits in selected-address-popup.tsx if using Google photos.
// The active Mapbox implementation lives in address-search.tsx.
//
// import { useEffect, useRef, useState } from "react";
// import { useDebouncedValue } from "@/hooks/use-debounced-state";
// import type { Coordinates, Place, PlaceSearch } from "@/utils/interfaces";
// import { useSearchStore } from "@/providers/search-store-provider";
// import {
//   placeRecord,
//   type SearchSuggestion,
// } from "@/components/map-box/utils/place-geocoding";
// import {
//   createGoogleSessionToken,
//   googleResolvePlace,
//   googleRetrieve,
//   googleSuggest,
// } from "@/components/map-box/utils/google-places";
// import { AddressCombobox, type AddressComboboxItem } from "./address-combobox";
// import { DESKTOP_SEARCH_COLUMN } from "@/components/map-box/map-panel-layout";
// import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
// import { useShallow } from "zustand/react/shallow";
//
// const SEARCH_RESULT_LIMIT = 3;
//
// type AddressOption = AddressComboboxItem &
//   (
//     | { kind: "result"; suggestion: SearchSuggestion }
//     | { kind: "recent"; search: PlaceSearch }
//   );
//
// export const GoogleAddressSearch = ({ proximity }: { proximity: Coordinates }) => {
//   const { lat, lng } = proximity;
//   const { searches, logSearch } = useSearchStore(
//     useShallow(({ searches, logSearch }) => ({ searches, logSearch })),
//   );
//   const sessionRef = useRef<{
//     token: string;
//     startedAt: number;
//     requests: number;
//   } | null>(null);
//   const suggestAbortRef = useRef<AbortController | null>(null);
//   const retrieveAbortRef = useRef<AbortController | null>(null);
//
//   // `query` drives the controlled input; `debounced` drives the fetch, so a
//   // Search Box /suggest request fires per typing pause, not per keystroke.
//   const [query, debounced, setQuery] = useDebouncedValue("", 300);
//   const [open, setOpen] = useState(false);
//   const [results, setResults] = useState<{
//     query: string;
//     hits: SearchSuggestion[];
//     error?: string;
//   } | null>(null);
//   const [retrieving, setRetrieving] = useState(false);
//   const [retrieveError, setRetrieveError] = useState(false);
//   const [selected, setSelected] = useState<AddressOption | null>(null);
//
//   const onSelect = (place: Place, query: string, log: boolean) => {
//     openPlacePopup.openWithPayload(place);
//     if (log) void logSearch({ ...placeRecord(place), query });
//   };
//
//   useEffect(() => () => retrieveAbortRef.current?.abort(), []);
//
//   useEffect(() => {
//     const trimmed = debounced.trim();
//     if (!open || query.trim() !== trimmed || trimmed.length < 2) return;
//
//     if (!sessionRef.current) {
//       sessionRef.current = {
//         token: createGoogleSessionToken(),
//         startedAt: Date.now(),
//         requests: 0,
//       };
//     }
//     const session = sessionRef.current;
//     session.requests += 1;
//
//     const controller = new AbortController();
//     suggestAbortRef.current = controller;
//     void googleSuggest(trimmed, {
//       sessionToken: session.token,
//       proximity: { lat, lng },
//       types:
//         "poi,address,street,place,locality,neighborhood,postcode,region,country",
//       limit: SEARCH_RESULT_LIMIT,
//       signal: controller.signal,
//     })
//       .then((hits) => {
//         if (!controller.signal.aborted) setResults({ query: trimmed, hits });
//       })
//       .catch(() => {
//         if (!controller.signal.aborted)
//           setResults({
//             query: trimmed,
//             hits: [],
//             error: "Couldn’t load suggestions. Try typing again.",
//           });
//       });
//     return () => controller.abort();
//   }, [debounced, query, open, lat, lng]);
//
//   const selectOption = (option: AddressOption) => {
//     if (retrieveAbortRef.current && !retrieveAbortRef.current.signal.aborted)
//       return;
//     const session = sessionRef.current;
//     if (option.kind === "result" && !session) return;
//     const searchQuery =
//       option.kind === "recent" ? option.search.query : query.trim();
//     setSelected(option);
//     setQuery(option.name);
//     setOpen(false);
//     setResults(null);
//     setRetrieveError(false);
//     suggestAbortRef.current?.abort();
//     retrieveAbortRef.current?.abort();
//
//     const controller = new AbortController();
//     retrieveAbortRef.current = controller;
//     setRetrieving(true);
//
//     sessionRef.current = null;
//     const request = option.kind === "recent"
//       ? googleResolvePlace(option.search, controller.signal)
//       : googleRetrieve(option.suggestion.mapboxId, {
//           sessionToken: session!.token,
//           signal: controller.signal,
//         });
//     void request
//       .then((place) => {
//         if (controller.signal.aborted) return;
//         if (place) onSelect(place, searchQuery, option.kind === "result");
//         else setRetrieveError(true);
//       })
//       .catch(() => {
//         if (!controller.signal.aborted) setRetrieveError(true);
//       })
//       .finally(() => {
//         if (controller.signal.aborted) return;
//         retrieveAbortRef.current = null;
//         setRetrieving(false);
//       });
//   };
//
//   const trimmedQuery = query.trim();
//   const pending =
//     open && trimmedQuery.length >= 2 && results?.query !== trimmedQuery;
//   const hits: AddressOption[] =
//     results?.query === trimmedQuery
//       ? results.hits.map((hit) => ({
//           id: hit.mapboxId,
//           name: hit.name,
//           address: [hit.streetAddress, hit.areaAddress]
//             .filter(Boolean)
//             .join(", "),
//           kind: "result",
//           suggestion: hit,
//         }))
//       : [];
//   const recentByPlace = new Map<string, PlaceSearch>();
//   for (const search of searches) {
//     const id =
//       search.mapboxId ??
//       `${search.name}:${search.coordinates.lat}:${search.coordinates.lng}`;
//     if (!recentByPlace.has(id)) recentByPlace.set(id, search);
//     if (recentByPlace.size === SEARCH_RESULT_LIMIT) break;
//   }
//   const recent: AddressOption[] = Array.from(recentByPlace, ([id, search]) => ({
//     id: `recent:${id}`,
//     name:
//       search.mapboxId?.startsWith("google:") || search.name === "Saved place"
//         ? search.query
//         : search.name,
//     address: [search.streetAddress, search.areaAddress]
//       .filter(Boolean)
//       .join(", "),
//     kind: "recent",
//     search,
//   }));
//
//   return (
//     <div
//       className={`pointer-events-auto absolute right-4 bottom-4 left-18 sm:right-auto ${DESKTOP_SEARCH_COLUMN}`}
//     >
//       <AddressCombobox
//         query={query}
//         results={trimmedQuery === "" ? recent : hits}
//         selected={selected}
//         open={open}
//         loading={pending}
//         disabled={retrieving}
//         error={results?.query === trimmedQuery ? results.error : undefined}
//         onQueryChange={(value) => {
//           setQuery(value);
//           setSelected(null);
//           suggestAbortRef.current?.abort();
//           setResults(null);
//           setRetrieveError(false);
//           setOpen(true);
//         }}
//         onOpenChange={setOpen}
//         onSelect={selectOption}
//       />
//       {retrieveError ? (
//         <p
//           role="status"
//           className="absolute bottom-full mb-4 w-full rounded-xl bg-white p-3 text-base text-neutral-600 shadow"
//         >
//           Couldn’t load that location. Try searching again.
//         </p>
//       ) : null}
//     </div>
//   );
// };
