import type { PropsWithChildren } from "react";
import { TravelLoader } from "@/providers/travel-loader";
import { TripStoreProvider } from "@/providers/trip-store-provider";
import { UserStoreProvider } from "@/providers/user-store-provider";
import { serverFetch } from "@/server/backend";
import { SearchStoreProvider } from "@/providers/search-store-provider";
import { StopDetailsStoreProvider } from "@/providers/stop-details-store-provider";

export const Providers = async ({ children }: PropsWithChildren) => {
  const [userInfo, fetchedTrips, fetchedSearches] = await Promise.all([
    serverFetch("user"),
    serverFetch("trips"),
    serverFetch("searches"),
  ]);

  return (
    <UserStoreProvider userInfo={userInfo}>
      <TripStoreProvider
        trips={fetchedTrips ?? []}
        tripsServerLoaded={fetchedTrips !== null}
      >
        <StopDetailsStoreProvider>
          <SearchStoreProvider
            searches={fetchedSearches ?? []}
            searchesServerLoaded={fetchedSearches !== null}
          >
            <TravelLoader />
            {children}
          </SearchStoreProvider>
        </StopDetailsStoreProvider>
      </TripStoreProvider>
    </UserStoreProvider>
  );
};
