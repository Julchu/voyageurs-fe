"use client";

import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
} from "react";
import type { Map } from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { LocationIcon, NorthIcon } from "@/components/ui/icons/map-controls";
import { NoPowerIcon, PowerIcon } from "@/components/ui/icons/power";
import Spinner from "@/components/ui/icons/spinner";
import useMapHook from "@/hooks/use-map-hook";
import { useUserStore } from "@/providers/user-store-provider";
import { SunIcon } from "@/components/ui/icons/suns";

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
  const [{ updatePerformance, triggerNorth, togglePerformanceLayer }] =
    useMapHook(map, mapLoading, setMapLoading);

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
          className="absolute bottom-5 left-5 h-10 w-10 cursor-pointer rounded-full bg-blue-600 p-0 opacity-100"
          onClick={updatePerformanceCallback}
        >
          {performanceMode ? <PowerIcon /> : <NoPowerIcon />}
        </Button>
      ) : null}

      {userInfo ? (
        <Button
          className={
            "absolute bottom-20 left-5 h-10 w-10 cursor-pointer rounded-full bg-blue-600 p-0 opacity-100"
          }
        >
          <SunIcon className={"h-6 w-6"} />
        </Button>
      ) : null}

      <Button
        className="absolute right-5 bottom-20 h-10 w-10 cursor-pointer rounded-full bg-blue-600 p-0 opacity-100"
        onClick={triggerNorth}
      >
        <NorthIcon className={"h-6 w-6"} />
      </Button>

      <Button
        className="absolute right-5 bottom-5 h-10 w-10 cursor-pointer rounded-full bg-blue-600 p-0 opacity-100"
        onClick={triggerGeolocator}
      >
        <LocationIcon className="absolute h-6 w-6" />
        <LocationIcon
          className={`absolute h-6 w-6 ${locationLoading ? "animate-ping" : ""}`}
        />
      </Button>
    </>
  );
};

export default Controls;