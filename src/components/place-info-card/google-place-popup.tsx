"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { googleLoadLibrary } from "@/components/google-map/utils/google-loader";
import {
  DESKTOP_SEARCH_COLUMN,
  MOBILE_PANEL_SIZE,
  MOBILE_PANEL_VIEWPORT,
} from "@/components/map-box/map-panel-layout";
import { placeRecord } from "@/components/map-box/utils/place-geocoding";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
import { XIcon } from "@/components/ui/icons/close-icons";
import { MapPinIcon } from "@/components/ui/icons/pin-icons";
import { useTripStore } from "@/providers/trip-store-provider";
import type { Place } from "@/utils/interfaces";

const placeDetailsClassName =
  "block w-full rounded-lg border-0 [color-scheme:light] [--gmp-mat-color-surface:white] [--gmp-mat-color-on-surface:#0a0a0a] [--gmp-mat-color-on-surface-variant:#525252] [--gmp-mat-color-primary:#2563eb] [--gmp-mat-color-secondary-container:#eff6ff] [--gmp-mat-color-on-secondary-container:#1d4ed8] [--gmp-mat-color-outline-decorative:#e5e5e5] [--gmp-mat-font-family:Arial,_Helvetica,_sans-serif] [--gmp-mat-font-title-small:600_18px/1.25_Arial,_Helvetica,_sans-serif] [--gmp-mat-font-body-small:400_14px/1.5_Arial,_Helvetica,_sans-serif] [--gmp-mat-font-label-large:500_14px/1.25_Arial,_Helvetica,_sans-serif] [--gmp-mat-spacing-extra-large:16px] [--gmp-mat-spacing-large:12px] [--gmp-mat-spacing-medium:8px] [--gmp-mat-spacing-small:4px] [--gmp-thumbnail-border-radius:8px] [--gmp-button-border-radius:8px] [--gmp-dialog-border-radius:16px]";

export const GooglePlacePopup = () => {
  return (
    <Dialog.Root handle={openPlacePopup} modal={false} disablePointerDismissal>
      {({ payload }) =>
        payload ? (
          <Dialog.Portal>
            <div
              className={`${MOBILE_PANEL_VIEWPORT} z-100 sm:top-auto sm:right-auto sm:bottom-60 sm:h-auto ${DESKTOP_SEARCH_COLUMN}`}
            >
              <GooglePlaceCard
                key={`${payload.clientId ?? payload.publicId ?? payload.id ?? payload.mapboxId ?? payload.name}:${payload.coordinates.lat}:${payload.coordinates.lng}`}
                payload={payload}
              />
            </div>
          </Dialog.Portal>
        ) : null
      }
    </Dialog.Root>
  );
};


const GooglePlaceCard = ({ payload }: { payload: Place }) => {
  const container = useRef<HTMLDivElement>(null);
  const addStop = useTripStore((state) => state.addStop);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const { lat, lng } = payload.coordinates;

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let details: google.maps.places.PlaceDetailsCompactElement | undefined;
    const events = new AbortController();

    const finishLoading = () => {
      if (events.signal.aborted) return;
      clearTimeout(timeout);
      setStatus("ready");
    };
    const cleanup = () => {
      events.abort();
      clearTimeout(timeout);
      details?.remove();
    };
    const fail = () => {
      if (events.signal.aborted) return;
      setStatus("error");
      cleanup();
    };
    const timeout = setTimeout(fail, 20000);

    const load = async () => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!key) throw new Error("Missing Google Maps API key");
      const {
        PlaceDetailsCompactElement,
        PlaceDetailsLocationRequestElement,
        PlaceMediaElement,
        PlaceNameElement,
        PlaceAddressElement,
        PlaceAttributionElement,
      } = await googleLoadLibrary(key, "places");
      if (events.signal.aborted) return;

      details = new PlaceDetailsCompactElement({ orientation: "VERTICAL" });
      details.className = placeDetailsClassName;
      details.addEventListener("gmp-load", finishLoading, {
        signal: events.signal,
      });
      details.addEventListener("gmp-error", fail, { signal: events.signal });
      details.append(
        new PlaceMediaElement(),
        new PlaceNameElement(),
        new PlaceAddressElement(),
        new PlaceAttributionElement({ lightSchemeColor: "BLACK" }),
        new PlaceDetailsLocationRequestElement({ location: { lat, lng } }),
      );
      host.append(details);
    };

    void load().catch(fail);
    return cleanup;
  }, [lat, lng, attempt]);

  return (
    <Dialog.Popup
      className={`@container pointer-events-auto relative flex ${MOBILE_PANEL_SIZE} flex-col overflow-hidden bg-white text-neutral-950 shadow transition-[scale,opacity] duration-100 ease-out outline-none data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none sm:h-[28rem] sm:max-h-[max(0px,calc(100dvh-16rem))]`}
    >
      <Dialog.Title className="sr-only">{payload.name}</Dialog.Title>
      <Dialog.Description className="sr-only">
        Place information and photos from Google Maps.
      </Dialog.Description>

      <div className="absolute top-2 right-3 z-10 flex items-center gap-4">
        <Dialog.Close
          aria-label="Add to trip"
          title="Add to trip"
          disabled={status === "loading"}
          onClick={() => addStop(placeRecord(payload))}
          className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium whitespace-nowrap text-white select-none hover:not-data-disabled:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MapPinIcon className="h-5 w-5 stroke-white" />
          <span className="hidden @min-[24rem]:inline">Add to trip</span>
        </Dialog.Close>
        <Dialog.Close
          aria-label="Close place card"
          className="cursor-pointer rounded-full bg-white/95 p-2 shadow-sm outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <XIcon className="h-5 w-5 fill-blue-500 stroke-blue-500" />
        </Dialog.Close>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
        aria-busy={status === "loading"}
      >
        <div
          ref={container}
          className={
            status === "ready" ? "min-h-full p-4" : "invisible min-h-full p-4"
          }
        />

        {status === "loading" && (
          <div
            role="status"
            className="absolute inset-0 flex flex-col gap-4 p-4"
          >
            <span className="sr-only">Loading place information…</span>
            <div
              aria-hidden="true"
              className="min-h-12 flex-1 rounded-lg bg-neutral-100 motion-safe:animate-pulse"
            />
            <div
              aria-hidden="true"
              className="h-5 w-2/3 shrink-0 rounded bg-neutral-100 motion-safe:animate-pulse"
            />
            <div
              aria-hidden="true"
              className="h-4 w-full shrink-0 rounded bg-neutral-100 motion-safe:animate-pulse"
            />
            <div
              aria-hidden="true"
              className="h-4 w-1/2 shrink-0 rounded bg-neutral-100 motion-safe:animate-pulse"
            />
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <p role="status" className="text-sm text-neutral-600">
              Place information could not be loaded.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus("loading");
                setAttempt((value) => value + 1);
              }}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </Dialog.Popup>
  );
};