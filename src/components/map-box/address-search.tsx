import { useEffect, useId, useState } from "react";
import useDebouncedState from "@/hooks/use-debounced-state";
import type { Coordinates, Place } from "@/utils/interfaces";
import { useSearchStore } from "@/providers/search-store-provider";

type GeocodeHit = Place & { id: string };

type GeocodeFeature = {
  id?: string;
  text?: string;
  place_name?: string;
  center?: [number, number];
};

const searchAddresses = async (
  query: string,
  proximity: Coordinates,
  signal: AbortSignal,
): Promise<GeocodeHit[]> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const trimmed = query.trim();
  if (!token || trimmed.length < 2) return [];

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "5");
  url.searchParams.set("proximity", `${proximity.lng},${proximity.lat}`);
  url.searchParams.set(
    "types",
    "streetAddress,place,poi,locality,neighborhood",
  );

  // const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
  // url.searchParams.set("longitude", String(lng));
  // url.searchParams.set("latitude", String(lat));
  // url.searchParams.set("access_token", token);
  // url.searchParams.set("types", "streetAddress");

  const response = await fetch(url, { signal });
  if (!response.ok) return [];
  const body = (await response.json()) as { features?: GeocodeFeature[] };
  return (body.features ?? []).flatMap((feature) => {
    const lng = feature.center?.[0];
    const lat = feature.center?.[1];
    const name = feature.text || feature.place_name;
    if (!name || typeof lng !== "number" || typeof lat !== "number") return [];
    return [
      {
        id: feature.id || `${lng},${lat}`,
        name,
        streetAddress: feature.place_name || "",
        // TODO: check for areaAddress
        coordinates: { lat, lng },
      },
    ];
  });
};

export const AddressSearch = ({
  onSelect,
  proximity,
}: {
  onSelect: (place: Place, query: string, log: boolean) => void;
  proximity: Coordinates;
}) => {
  const listId = useId();
  const searches = useSearchStore(({ searches }) => searches);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const debounced = useDebouncedState(query, 300);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed.length < 2) return;

    const controller = new AbortController();
    void searchAddresses(trimmed, proximity, controller.signal)
      .then((next) => setHits(next))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setHits([]);
      });
    return () => controller.abort();
  }, [debounced, proximity]);

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
        aria-label="Search address"
        placeholder="Search an address"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        className="w-full rounded-md bg-white px-4 py-2 text-sm text-neutral-950 shadow outline-none"
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
                <li key={hit.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-3 py-2 text-left hover:bg-neutral-100"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setQuery(hit.name);
                      setOpen(false);
                      onSelect(hit, query.trim(), true);
                    }}
                  >
                    <span className="block truncate">{hit.name}</span>
                    <span className="block truncate text-xs text-neutral-500">
                      {hit.streetAddress}
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