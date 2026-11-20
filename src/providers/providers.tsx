import type { PropsWithChildren } from "react";
import { TravelLoader } from "@/components/trips-drawer/travel-loader";
import { TripStoreProvider } from "@/providers/trip-store-provider";
import { UserStoreProvider } from "@/providers/user-store-provider";
import { serverFetch } from "@/server/backend";
import type { PlaceSearch, UserInfo } from "@/utils/interfaces";
import type { TripDto } from "@/types/trip-api";
import { SearchStoreProvider } from "@/providers/search-store-provider";
import { StopDetailsStoreProvider } from "@/providers/stop-details-store-provider";

export const Providers = async ({ children }: PropsWithChildren) => {
  const [userInfo, fetchedTrips, fetchedSearches] = await Promise.all([
    serverFetch<UserInfo>("user"),
    serverFetch<TripDto[]>("trips"),
    serverFetch<PlaceSearch[]>("searches"),
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
