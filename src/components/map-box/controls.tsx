"use client";

import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
} from "react";
import type { Map } from "mapbox-gl";
import { Button } from "@/components/ui/button";
import {
  DawnIcon,
  DayIcon,
  DuskIcon,
  LocationIcon,
  NightIcon,
  NorthIcon,
} from "@/components/ui/icons/map-control-icons";
import Spinner from "@/components/ui/icons/spinner";
import { useMapHook } from "@/hooks/use-map-hook";
import { useUserStore } from "@/providers/user-store-provider";
import { useShallow } from "zustand/react/shallow";
import { MapTimeEnum, MapTimeType, MapTimeValues } from "@/utils/interfaces";

const Controls = ({
  map,
  mapLoading,
  setMapLoading,
  locationLoading,
  triggerGeolocator,
  shouldUseDarkMode,
  currentMapTimeMode,
  setCurrentMapTimeMode,
}: {
  map: RefObject<Map | null>;
  mapLoading: boolean;
  setMapLoading: Dispatch<SetStateAction<boolean>>;
  locationLoading: boolean;
  triggerGeolocator: () => void;
  shouldUseDarkMode: boolean;
  currentMapTimeMode: MapTimeType;
  setCurrentMapTimeMode: Dispatch<SetStateAction<MapTimeType>>;
}) => {
  const { userInfo } = useUserStore(
    useShallow(({ userInfo }) => ({
      userInfo,
    })),
  );
  const [{ updatePerformance, triggerNorth, setLightMode }] = useMapHook({
    map,
    mapLoading,
    setMapLoading,
    currentMapTimeMode,
  });

  const updatePerformanceCallback = useCallback(async () => {
    await updatePerformance();
    // togglePerformanceLayer(!performanceMode);
  }, [updatePerformance]);

  const rotateMapTime = useCallback(() => {
    const currentIndex = MapTimeValues.indexOf(currentMapTimeMode);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % MapTimeValues.length;
    const nextMode = MapTimeValues[nextIndex];
    setLightMode(nextMode);
    setCurrentMapTimeMode(nextMode);
  }, [currentMapTimeMode, setCurrentMapTimeMode, setLightMode]);

  const mapTimeIcon = {
    [MapTimeEnum.dawn]: <DawnIcon className={"h-6 w-6"} />,
    [MapTimeEnum.day]: <DayIcon className={"h-6 w-6"} />,
    [MapTimeEnum.dusk]: <DuskIcon className={"h-6 w-6"} />,
    [MapTimeEnum.night]: <NightIcon className={"h-6 w-6"} />,
  };

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
          className="absolute bottom-5 left-5 h-10 w-10 cursor-pointer rounded-full bg-blue-600 p-0 opacity-50"
          onClick={updatePerformanceCallback}
        >
          {/*{performanceMode ? (*/}
          {/*  <PowerIcon className={"h-6 w-6"} />*/}
          {/*) : (*/}
          {/*  <NoPowerIcon className={"h-6 w-6"} />*/}
          {/*)}*/}
        </Button>
      ) : null}

      {userInfo ? (
        <Button
          className={
            "absolute bottom-20 left-5 h-10 w-10 cursor-pointer rounded-full bg-blue-600 p-0 opacity-50"
          }
          onClick={rotateMapTime}
        >
          {mapTimeIcon[currentMapTimeMode]}
        </Button>
      ) : null}

      <Button
        className="absolute right-5 bottom-20 h-10 w-10 cursor-pointer rounded-full bg-blue-600 p-0 opacity-50"
        onClick={triggerNorth}
      >
        <NorthIcon className={"h-6 w-6"} />
      </Button>

      <Button
        className="absolute right-5 bottom-5 h-10 w-10 cursor-pointer rounded-full bg-blue-600 p-0 opacity-50"
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