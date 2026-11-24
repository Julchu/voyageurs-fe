import { useTripStore } from "@/providers/trip-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@base-ui/react/button";
import { cn } from "cn";
import { XIcon } from "@/components/ui/icons/close-icons";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
import { resolveMapboxPlace } from "@/components/map-box/utils/poi-click-place";
import { placeIdentity } from "@/utils/place-identity";
import type { Place } from "@/types/place";
import Image from "next/image";
import {
  DESKTOP_SEARCH_COLUMN,
  MOBILE_PANEL_SIZE,
  MOBILE_PANEL_VIEWPORT,
} from "@/components/map-box/map-panel-layout";
import { tripDrawerHandle } from "@/components/trips-drawer/trip-drawer";
import { MapAddIcon } from "@/components/ui/icons/map-icons";
import { PlaceCategoryBadge } from "./place-category-badge";
import { getPlacePlaceholder } from "./utils/place-category";
import { TripadvisorPhotoCredits } from "./tripadvisor-credits";
import { fetchTripadvisorPhotos } from "@/api/tripadvisor-photos";
import { popupMotion } from "@/components/ui/popup-styles";

type LookupState = {
  status: "loading" | "ready" | "error";
  attempt: number;
};

const PlaceCard = ({ payload }: { payload: Place }) => {
  const addStop = useTripStore(({ addStop }) => addStop);
  const [place, setPlace] = useState(payload);
  const [lookup, setLookup] = useState<LookupState>({
    status: payload.placeInfoLoaded ? "ready" : "loading",
    attempt: 0,
  });
  const [failedPhotos, setFailedPhotos] = useState<string[]>([]);
  const signedIn = useUserStore(({ userInfo }) => !!userInfo);

  // POIs load Places details on open; addresses already have their search fields.
  useEffect(() => {
    if (payload.placeInfoLoaded) return;
    const controller = new AbortController();
    const { signal } = controller;
    void (async () => {
      const found = await resolveMapboxPlace(payload, signal);
      if (signal.aborted) return;
      if (found) setPlace(found);
      setLookup((current) => ({
        ...current,
        status: found ? "ready" : "error",
      }));

      // Tripadvisor is billed per lookup: signed-in only, only after a found place with no Mapbox photos.
      if (!found || !signedIn || found.photos?.length) return;
      const photos = await fetchTripadvisorPhotos(found, signal);
      if (photos && !signal.aborted) setPlace({ ...found, ...photos });
    })();
    return () => controller.abort();
  }, [payload, lookup.attempt, signedIn]);

  const photo = place.photos?.find(
    (photo) => !failedPhotos.includes(photo.url),
  );
  const lookingUp = lookup.status === "loading";
  const addressPending = lookingUp && !place.streetAddress;

  return (
    <Dialog.Popup
      className={cn(
        popupMotion,
        MOBILE_PANEL_SIZE,
        "pointer-events-auto relative flex flex-col overflow-hidden overscroll-contain bg-white text-neutral-950 shadow outline-none sm:h-auto sm:max-h-[max(0px,calc(100dvh-16rem))] sm:overflow-y-auto",
      )}
    >
      <Dialog.Close
        aria-label="Close place card"
        className="absolute top-3 right-3 z-10 cursor-pointer rounded-full bg-white/95 p-2 shadow-sm outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <XIcon className="h-5 w-5 fill-blue-500 stroke-blue-500" />
      </Dialog.Close>
      <figure className="relative min-h-12 w-full flex-1 overflow-hidden bg-neutral-100 sm:h-40 sm:min-h-0 sm:flex-none">
        <Image
          src={photo?.url ?? getPlacePlaceholder(place)}
          unoptimized={Boolean(photo)}
          alt={photo ? place.name : ""}
          fill
          sizes="(min-width: 40rem) min(28rem, calc(100vw - 2rem)), calc(100vw - 5.5rem)"
          className="object-cover"
          onError={
            photo
              ? () => setFailedPhotos((failed) => [...failed, photo.url])
              : undefined
          }
        />
        {photo ? (
          <TripadvisorPhotoCredits
            photo={photo}
            tripadvisorUrl={place.tripadvisorUrl}
          />
        ) : null}
      </figure>

      <div className="flex min-h-0 shrink flex-col p-4 sm:shrink-0">
        <div className="min-h-0 overflow-y-auto sm:overflow-visible">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="truncate text-xl leading-tight font-semibold">
                {place.name}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-neutral-600">
                <span
                  className={cn(
                    "block",
                    !addressPending && place.streetAddress && "capitalize",
                  )}
                >
                  {addressPending
                    ? "Loading place…"
                    : place.streetAddress || "Street address unavailable"}
                </span>
                <span
                  className={cn(
                    "mt-1 block",
                    !lookingUp && place.areaAddress && "capitalize",
                  )}
                >
                  {lookingUp && !place.areaAddress
                    ? "Loading place…"
                    : place.areaAddress || "Area address unavailable"}
                </span>
              </Dialog.Description>
            </div>
          </div>

          {lookup.status === "error" ? (
            <p role="status" className="mt-3 text-sm text-neutral-500">
              Couldn’t load place information.{" "}
              <Button
                type="button"
                onClick={() => {
                  setLookup(({ attempt }) => ({
                    status: "loading",
                    attempt: attempt + 1,
                  }));
                }}
                className="cursor-pointer text-blue-600 hover:underline"
              >
                Retry
              </Button>
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
          <PlaceCategoryBadge
            category={place.category}
            className="items-center self-start sm:max-w-[45%] sm:self-center"
          />
          <div className="flex items-center sm:ml-auto sm:border-neutral-200 sm:pl-4">
            <Dialog.Close
              onClick={() => {
                addStop(place);
                tripDrawerHandle.open(null);
              }}
              disabled={lookingUp}
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 text-sm leading-none font-medium whitespace-nowrap text-white select-none hover:not-data-disabled:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <MapAddIcon className="h-5 w-5 fill-none stroke-white" />
              Add to trip
            </Dialog.Close>
          </div>
        </div>
      </div>
    </Dialog.Popup>
  );
};

export const SelectedAddressPopup = () => (
  <Dialog.Root handle={openPlacePopup} modal={false} disablePointerDismissal>
    {({ payload }) => {
      if (!payload) return;
      return (
        <Dialog.Portal>
          <div
            className={cn(
              MOBILE_PANEL_VIEWPORT,
              "z-100 sm:top-auto sm:right-auto sm:bottom-60 sm:h-auto",
              DESKTOP_SEARCH_COLUMN,
            )}
          >
            <PlaceCard key={placeIdentity(payload)} payload={payload} />
          </div>
        </Dialog.Portal>
      );
    }}
  </Dialog.Root>
);
