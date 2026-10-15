import { useTripStore } from "@/providers/trip-store-provider";
import {
  CurrentLocationIcon,
  MapPinIcon,
} from "@/components/ui/icons/map-pins";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "@/components/ui/icons/close-icons";
import { openPlacePopup } from "@/components/map-box/map-components";
import {
  fetchGooglePlaceDetails,
  googleResolvePlace,
  needsGooglePlaceLookup,
} from "@/components/map-box/utils/google-places";
import type { Place, PlacePhoto } from "@/utils/interfaces";
import Image from "next/image";

const dedupePhotos = (
  ...groups: (PlacePhoto[] | undefined)[]
): PlacePhoto[] => {
  const seen = new Set<string>();
  const result: PlacePhoto[] = [];
  for (const group of groups) {
    for (const photo of group ?? []) {
      if (seen.has(photo.url)) continue;
      seen.add(photo.url);
      result.push(photo);
    }
  }
  return result;
};

const PlaceCard = ({ payload }: { payload: Place }) => {
  const addStop = useTripStore(({ addStop }) => addStop);
  const rememberPlace = useTripStore(({ rememberPlace }) => rememberPlace);
  const getRememberedPlace = useTripStore(
    ({ getRememberedPlace }) => getRememberedPlace,
  );
  const [initialPlace] = useState(() => getRememberedPlace(payload));
  const [place, setPlace] = useState(initialPlace);
  const [lookingUp, setLookingUp] = useState(() =>
    needsGooglePlaceLookup(initialPlace),
  );
  const [lookupError, setLookupError] = useState(false);
  const [lookupAttempt, setLookupAttempt] = useState(0);
  const [detailsError, setDetailsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  // State is reset per place by remounting via `key` in the parent; here we
  // only need to abort any in-flight request when the card unmounts.
  useEffect(() => () => controllerRef.current?.abort(), []);

  // Fetch missing metadata on open, even when an older stop already has an id.
  // Reopening a saved stop (or its basemap POI) reuses the remembered data.
  useEffect(() => {
    if (!needsGooglePlaceLookup(initialPlace)) return;
    const controller = new AbortController();
    void googleResolvePlace(initialPlace, controller.signal).then((next) => {
      if (controller.signal.aborted) return;
      setLookingUp(false);
      if (!next) {
        setLookupError(true);
        return;
      }
      setPlace(next);
      // TODO: think of a better way than rememberPlace for temp info
      rememberPlace(next);
    });
    return () => controller.abort();
  }, [initialPlace, lookupAttempt, rememberPlace]);

  const loadDetails = () => {
    setExpanded(true);
    if (!place.mapboxId || lookingUp || loading || place.details) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setDetailsError(false);
    void fetchGooglePlaceDetails(place.mapboxId, controller.signal).then(
      (next) => {
        if (controller.signal.aborted) return;
        setLoading(false);
        if (!next) {
          setDetailsError(true);
          return;
        }
        const updated = {
          ...place,
          photos: dedupePhotos(place.photos, next.photos),
          details: next,
        };
        setPlace(updated);
        rememberPlace(updated);
      },
    );
  };

  const details = place.details;
  const photos = dedupePhotos(place.photos, details?.photos);
  const addressPending = lookingUp && !place.streetAddress;

  return (
    <Dialog.Popup className="fixed top-1/2 left-1/2 -mt-8 flex max-h-[calc(100vh-3rem)] w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-4 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
      <div className="flex flex-col gap-1">
        <header className={"flex w-full flex-row justify-between gap-2"}>
          <Dialog.Title className="text-base font-bold">
            {place.name}
          </Dialog.Title>
          <Dialog.Close className={"outline-none"}>
            <XIcon
              className={"h-5 w-5 cursor-pointer fill-blue-500 stroke-blue-500"}
            />
          </Dialog.Close>
        </header>
        <Dialog.Description
          className={
            "flex flex-row items-center gap-1 text-sm text-neutral-600"
          }
        >
          <CurrentLocationIcon
            className={"h-3 w-3 fill-none stroke-blue-500"}
          />
          {addressPending
            ? "Loading place…"
            : place.streetAddress || "No address yet"}
        </Dialog.Description>
        <Dialog.Description className="text-sm text-neutral-600">
          {addressPending
            ? "Loading place…"
            : place.areaAddress || "No address yet"}
        </Dialog.Description>
        <Dialog.Description className="text-sm text-neutral-600">
          {place.category || "No category"}
        </Dialog.Description>
      </div>

      {photos.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {photos.slice(0, expanded ? 12 : 6).map((photo) => (
            <div
              key={photo.url}
              className="relative h-24 w-32 flex-none overflow-hidden rounded-lg"
            >
              <Image
                src={photo.url}
                alt={place.name}
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      {expanded && details ? (
        <dl className="flex flex-col gap-1 text-sm text-neutral-600">
          {details.website ? (
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-800">Website</dt>
              <dd className="truncate">
                <a
                  href={details.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {details.website.replace(/^https?:\/\//, "")}
                </a>
              </dd>
            </div>
          ) : null}
          {details.phone ? (
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-800">Phone</dt>
              <dd>
                <a
                  href={`tel:${details.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {details.phone}
                </a>
              </dd>
            </div>
          ) : null}
          {details.openingHours ? (
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-800">Hours</dt>
              <dd className="whitespace-pre-wrap">{details.openingHours}</dd>
            </div>
          ) : null}
          {details.permanentlyClosed ? (
            <div className="font-medium text-red-600">Permanently closed</div>
          ) : null}
        </dl>
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading details…</p>
      ) : null}

      {lookupError ? (
        <p role="status" className="text-sm text-neutral-500">
          Couldn’t load place information.{" "}
          <button
            type="button"
            onClick={() => {
              setLookingUp(true);
              setLookupError(false);
              setLookupAttempt((attempt) => attempt + 1);
            }}
            className="cursor-pointer text-blue-600 hover:underline"
          >
            Retry
          </button>
        </p>
      ) : null}
      {detailsError ? (
        <p role="status" className="text-sm text-neutral-500">
          Couldn’t load details.
        </p>
      ) : null}

      <div className="flex justify-between gap-3">
        {place.mapboxId &&
        !lookingUp &&
        !lookupError &&
        (!expanded || detailsError) ? (
          <button
            type="button"
            onClick={loadDetails}
            className="flex h-8 cursor-pointer items-center justify-center rounded-lg px-3 text-sm leading-none font-normal whitespace-nowrap text-blue-600 select-none hover:bg-neutral-100 active:bg-neutral-200"
          >
            {detailsError ? "Retry details" : "See more details"}
          </button>
        ) : (
          <span />
        )}
        <Dialog.Close
          onClick={() => {
            addStop(place);
          }}
          disabled={lookingUp}
          className="flex h-8 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm leading-none font-normal whitespace-nowrap text-white select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 disabled:border-neutral-500 disabled:text-neutral-500 data-disabled:border-neutral-500 data-disabled:text-neutral-500 dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400"
        >
          <MapPinIcon className={"h-6 w-6 stroke-white"} />
          Add to trip
        </Dialog.Close>
      </div>
    </Dialog.Popup>
  );
};

export const SelectedAddressPopup = () => {
  return (
    <Dialog.Root handle={openPlacePopup} modal={false} disablePointerDismissal>
      {({ payload }) => {
        if (!payload) return;
        return (
          <Dialog.Portal>
            <PlaceCard
              key={`${payload.clientId ?? payload.publicId ?? payload.id ?? payload.name}:${payload.coordinates.lat}:${payload.coordinates.lng}`}
              payload={payload}
            />
          </Dialog.Portal>
        );
      }}
    </Dialog.Root>
  );
};