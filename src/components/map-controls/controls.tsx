import { type RefObject, useState } from "react";
import type { Map } from "mapbox-gl";
import {
  DawnIcon,
  DayIcon,
  DuskIcon,
  LocationIcon,
  NightIcon,
  NorthIcon,
  PowerIcon,
} from "@/components/ui/icons/control-icons";
import { Spinner } from "@/components/ui/icons/spinner";
import { useMapHook } from "@/hooks/use-map-hook";
import { useUserStore } from "@/providers/user-store-provider";
import { useShallow } from "zustand/react/shallow";
import { MapTimeEnum, MapTimeValues } from "@/utils/interfaces";
import { Toolbar } from "@base-ui/react/toolbar";
import { cn } from "cn";
import { mapTimeFromDate } from "@/utils/map-time";

export const Controls = ({
  map,
  mapLoading,
  locationLoading,
  triggerGeolocator,
}: {
  map: RefObject<Map | null>;
  mapLoading: boolean;
  locationLoading: boolean;
  triggerGeolocator: () => void;
}) => {
  const { userInfo } = useUserStore(
    useShallow(({ userInfo }) => ({
      userInfo,
    })),
  );

  const [currentMapTimeMode, setCurrentMapTimeMode] = useState(() =>
    mapTimeFromDate(),
  );

  const [performanceMode, setPerformanceModeState] = useState(false);

  const { triggerNorth, setLightMode, setPerformanceMode } = useMapHook({
    map,
  });

  const togglePerformanceMode = () => {
    if (!map.current) return;
    const nextMode = !performanceMode;
    setPerformanceMode(nextMode);
    setPerformanceModeState(nextMode);
  };

  const rotateMapTime = () => {
    const currentIndex = MapTimeValues.indexOf(currentMapTimeMode);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % MapTimeValues.length;
    const nextMode = MapTimeValues[nextIndex];
    setLightMode(nextMode);
    setCurrentMapTimeMode(nextMode);
  };

  const mapTimeIcon = {
    [MapTimeEnum.DAWN]: (
      <DawnIcon className={"h-6 w-6 fill-none stroke-white"} />
    ),
    [MapTimeEnum.DAY]: <DayIcon className={"h-6 w-6 fill-none stroke-white"} />,
    [MapTimeEnum.DUSK]: (
      <DuskIcon className={"h-6 w-6 fill-none stroke-white"} />
    ),
    [MapTimeEnum.NIGHT]: (
      <NightIcon className={"h-6 w-6 fill-none stroke-white"} />
    ),
  };

  if (mapLoading)
    return (
      <div className="absolute top-1/2 right-1/2 bottom-1/2 left-1/2 bg-none">
        <Spinner className="h-10 w-10 animate-spin fill-blue-500" />
      </div>
    );

  return (
    <Toolbar.Root orientation="vertical" className="absolute bottom-4 left-4">
      <Toolbar.Group className="flex flex-col gap-4">
        <Toolbar.Button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-500/50 hover:bg-blue-500 focus-visible:bg-blue-500 motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out"
          onClick={triggerGeolocator}
        >
          <LocationIcon className="absolute h-6 w-6 stroke-white" />
          <LocationIcon
            className={cn(
              `absolute h-6 w-6 stroke-white ${locationLoading ? "animate-ping" : ""}`,
            )}
          />
        </Toolbar.Button>

        <Toolbar.Button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-500/50 hover:bg-blue-500 focus-visible:bg-blue-500 motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out"
          onClick={triggerNorth}
        >
          <NorthIcon className={"h-6 w-6 stroke-white"} />
        </Toolbar.Button>

        {userInfo ? (
          <Toolbar.Button
            className={
              "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-500/50 hover:bg-blue-500 focus-visible:bg-blue-500 motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out"
            }
            onClick={rotateMapTime}
          >
            {mapTimeIcon[currentMapTimeMode]}
          </Toolbar.Button>
        ) : null}

        {userInfo ? (
          <Toolbar.Button
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-500/50 hover:bg-blue-500 focus-visible:bg-blue-500 motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out"
            aria-label="Performance mode"
            aria-pressed={performanceMode}
            title={
              performanceMode
                ? "Turn off performance mode"
                : "Turn on performance mode"
            }
            onClick={togglePerformanceMode}
          >
            <PowerIcon
              aria-hidden="true"
              className="h-6 w-6 stroke-white"
              crossed={!performanceMode}
            />
          </Toolbar.Button>
        ) : null}
      </Toolbar.Group>
    </Toolbar.Root>
  );
};
