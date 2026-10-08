import type { PropsWithChildren } from "react";
import { TravelLoader } from "@/components/trips/travel-loader";
import { TripStoreProvider } from "@/providers/trip-store-provider";
import { UserStoreProvider } from "@/providers/user-store-provider";
import { serverFetch } from "@/utils/server-actions/server-fetch";
import type { PlaceSearch, Trip, UserInfo } from "@/utils/interfaces";
import { SearchStoreProvider } from "@/providers/search-store-provider";

export const Providers = async ({ children }: PropsWithChildren) => {
  const userInfo = await serverFetch<UserInfo>({ endpoint: "user" });

  const fetchedTrips = userInfo
    ? await serverFetch<Trip[]>({ endpoint: "trips" })
    : null;

  const trips = fetchedTrips ?? [];
  const tripsServerLoaded = fetchedTrips !== null;

  const fetchedSearches = userInfo
    ? await serverFetch<PlaceSearch[]>({ endpoint: "searches" })
    : null;

  const searches = fetchedSearches ?? [];
  const searchesServerLoaded = fetchedSearches !== null;

  return (
    <UserStoreProvider userInfo={userInfo}>
      <TripStoreProvider trips={trips} tripsServerLoaded={tripsServerLoaded}>
        <SearchStoreProvider
          searches={searches}
          searchesServerLoaded={searchesServerLoaded}
        >
          <TravelLoader />
          {children}
        </SearchStoreProvider>
      </TripStoreProvider>
    </UserStoreProvider>
  );
};