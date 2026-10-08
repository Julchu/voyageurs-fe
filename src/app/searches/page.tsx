"use client";

import Link from "next/link";
import { useUserStore } from "@/providers/user-store-provider";
import { useSearchStore } from "@/providers/search-store-provider";
import { useShallow } from "zustand/react/shallow";

const SearchesPage = () => {
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  const { searches, searchesLoadState } = useSearchStore(
    useShallow(({ searches, searchesLoadState }) => ({
      searches,
      searchesLoadState,
    })),
  );

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 pt-20 pb-6">
      <h1 className="text-lg font-medium tracking-widest">Searches</h1>
      {!userInfo ? (
        <p className="text-sm text-neutral-500">
          Sign in to keep this log on your account. Until then it stays in this
          browser.
        </p>
      ) : null}
      {searchesLoadState === "loading" ? (
        <p className="text-sm text-neutral-500">Loading searches</p>
      ) : null}
      {searchesLoadState === "error" ? (
        <p className="text-sm text-red-600">Searches could not be loaded.</p>
      ) : null}
      {searches.length === 0 && searchesLoadState === "loaded" ? (
        <p className="text-sm text-neutral-500">
          Search an address on the map and it will show up here.
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {searches.map((search) => (
          <li key={search.publicId} className="rounded-xl bg-white p-4 shadow">
            <Link
              href={`/?lat=${search.coordinates.lat}&lng=${search.coordinates.lng}`}
              className="text-sm font-medium hover:underline"
            >
              {search.name}
            </Link>
            <p className="text-sm text-neutral-500">
              {search.address || search.query}
            </p>
            <p className="text-xs text-neutral-400">
              {search.query} · {new Date(search.searchedAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchesPage;