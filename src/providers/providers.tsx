import type { PropsWithChildren } from "react";
import { TravelLoader } from "@/components/trips/travel-loader";
import { TravelStoreProvider } from "@/providers/travel-store-provider";
import { UserStoreProvider } from "@/providers/user-store-provider";
import { serverFetch } from "@/utils/server-actions/server-fetch";
import type { PlaceSearch, ServerTrip, UserInfo } from "@/utils/interfaces";

export const Providers = async ({ children }: PropsWithChildren) => {
  const userInfo = await serverFetch<UserInfo>({ endpoint: "user" });
  const trips = userInfo ? await serverFetch<ServerTrip[]>({ endpoint: "trips" }) : null;
  const searches = userInfo ? await serverFetch<PlaceSearch[]>({ endpoint: "searches" }) : null;

  return (
    <UserStoreProvider userInfo={userInfo}>
      <TravelStoreProvider trips={trips} searches={searches}>
        <TravelLoader />
        {children}
      </TravelStoreProvider>
    </UserStoreProvider>
  );
};
