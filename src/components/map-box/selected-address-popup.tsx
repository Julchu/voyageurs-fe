import { useTripStore } from "@/providers/trip-store-provider";
import {
  CurrentLocationIcon,
  MapPinIcon,
} from "@/components/ui/icons/map-pins";
import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "@/components/ui/icons/close-icons";
import { openPlacePopup } from "@/components/map-box/place-popup-handle";
import {
  getMapboxPlacePreview,
  resolveMapboxPlace,
  needsMapboxPlaceLookup,
  placeRecord,
} from "@/components/map-box/utils/place-geocoding";
import type { Place, PlacePhoto } from "@/utils/interfaces";
import Image from "next/image";

// TODO: check if this is needed
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
  const [initialPlace] = useState(() => getMapboxPlacePreview(payload));
  const [place, setPlace] = useState(initialPlace);
  const [lookingUp, setLookingUp] = useState(() =>
    needsMapboxPlaceLookup(initialPlace),
  );
  const [lookupError, setLookupError] = useState(false);
  const [lookupAttempt, setLookupAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState<string[]>([]);

  // Fetch missing metadata on open, even when an older stop already has an id.
  // Reopening a place reuses temporary Mapbox data rather than saved Google data.
  useEffect(() => {
    if (!needsMapboxPlaceLookup(initialPlace)) return;
    const controller = new AbortController();
    void resolveMapboxPlace(initialPlace, controller.signal).then((next) => {
      if (controller.signal.aborted) return;
      setLookingUp(false);
      if (!next) {
        setLookupError(true);
        return;
      }
      setPlace(next);
    });
    return () => controller.abort();
  }, [initialPlace, lookupAttempt]);

  const details = place.details;
  const photos = dedupePhotos(place.photos, details?.photos).filter(
    (photo) => !failedPhotos.includes(photo.url),
  );
  const addressPending = lookingUp && !place.streetAddress;

  return (
    <Dialog.Popup className="fixed top-1/2 left-1/2 -mt-8 flex max-h-[calc(100vh-3rem)] w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-4 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
      <div className="flex flex-col gap-1">
        <header className={"flex w-full flex-row justify-between gap-2"}>
          <Dialog.Title className="text-base font-bold">
            {place.name}
          </Dialog.Title>
          <Dialog.Close
            aria-label="Close place card"
            className={"outline-none"}
          >
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
            : place.streetAddress || "Street address unavailable"}
        </Dialog.Description>
        <Dialog.Description className="text-sm text-neutral-600">
          {lookingUp && !place.areaAddress
            ? "Loading place…"
            : place.areaAddress || "Area address unavailable"}
        </Dialog.Description>
        <Dialog.Description className="text-sm text-neutral-600">
          {place.category.replaceAll("_", " ") || "Category unavailable"}
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
                unoptimized
                alt={place.name}
                fill
                sizes="128px"
                className="object-cover"
                onError={() =>
                  setFailedPhotos((failed) => [...failed, photo.url])
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          role="status"
          className="flex h-24 items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-500"
        >
          {lookingUp ? "Loading photo…" : "No photo available"}
        </div>
      )}

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
      <div className="flex justify-between gap-3">
        {details ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="flex h-8 cursor-pointer items-center justify-center rounded-lg px-3 text-sm leading-none font-normal whitespace-nowrap text-blue-600 select-none hover:bg-neutral-100 active:bg-neutral-200"
          >
            {expanded ? "Hide details" : "More details"}
          </button>
        ) : (
          <span />
        )}
        <Dialog.Close
          onClick={() => {
            // Enrichment stays temporary; the trip keeps its core stop fields.
            addStop(placeRecord(place));
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
