"use client";

import { type Dispatch, type RefObject, type SetStateAction, useCallback } from "react";
import type { Map } from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { LocationIcon, NorthIcon } from "@/components/ui/icons/map-controls";
import { NoPowerIcon, PowerIcon } from "@/components/ui/icons/power";
import Spinner from "@/components/ui/spinner";
import useMapHook from "@/hooks/use-map-hook";
import { useUserStore } from "@/providers/user-store-provider";

const Controls = ({
  map,
  mapLoading,
  setMapLoading,
  locationLoading,
  triggerGeolocator,
  shouldUseDarkMode,
}: {
  map: RefObject<Map | null>;
  mapLoading: boolean;
  setMapLoading: Dispatch<SetStateAction<boolean>>;
  locationLoading: boolean;
  triggerGeolocator: () => void;
  shouldUseDarkMode: boolean;
}) => {
  const userInfo = useUserStore((state) => state.userInfo);
  const performanceMode = useUserStore((state) => state.performanceMode);
  const [{ updatePerformance, triggerNorth, togglePerformanceLayer }] = useMapHook(
    map,
    mapLoading,
    setMapLoading,
  );

  const updatePerformanceCallback = useCallback(async () => {
    await updatePerformance();
    togglePerformanceLayer(!performanceMode);
  }, [performanceMode, togglePerformanceLayer, updatePerformance]);

  if (mapLoading)
    return (
      <div className="absolute top-1/2 right-1/2 bottom-1/2 left-1/2 bg-none">
        <Spinner shouldUseDarkMode={shouldUseDarkMode} />
      </div>
    );

  return (
    <>
      {userInfo ? (
        <Button
          className="absolute bottom-5 left-5 h-[40px] w-[40px] rounded-full bg-blue-600 p-0 opacity-60"
          onClick={updatePerformanceCallback}
        >
          {performanceMode ? <PowerIcon /> : <NoPowerIcon />}
        </Button>
      ) : null}

      <Button
        className="absolute right-5 bottom-20 h-[40px] w-[40px] rounded-full bg-blue-600 p-0 opacity-60"
        onClick={triggerNorth}
      >
        <NorthIcon />
      </Button>

      <Button
        className="absolute right-5 bottom-5 h-[40px] w-[40px] rounded-full bg-blue-600 p-0 opacity-60"
        onClick={triggerGeolocator}
      >
        <LocationIcon className="absolute" />
        <LocationIcon className={`absolute ${locationLoading ? "animate-ping" : ""}`} />
      </Button>
    </>
  );
};

export default Controls;
