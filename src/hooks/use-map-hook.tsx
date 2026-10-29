import { type RefObject, useCallback, useMemo, useState } from "react";
import { Map, Marker } from "mapbox-gl";
import { Coordinates, MapTimeType } from "@/utils/interfaces";
import { renderToStaticMarkup } from "react-dom/server";
import { CurrentLocationPinIcon } from "@/components/ui/icons/pin-icons";
import { AnimatedHomeIcon } from "@/components/ui/icons/home-icon";
import { darkMode } from "@/utils/map-time";

type MapMethods = {
  triggerGeolocator: () => void;
  triggerNorth: () => void;
  updatePerformance: () => Promise<void>;
  addMarker: (
    htmlElement: string,
    currentMarker: Marker | undefined,
    setCurrentMarker: (marker: Marker | undefined) => void,
    coords: Coordinates,
    save?: boolean,
  ) => void;
  togglePerformanceLayer: (toggleOn?: boolean) => void;
  removePerformanceLayer: () => void;
  addPerformanceLayer: () => void;
  flyTo: (coords: Coordinates, zoom?: number) => void;
  mapStyles: Record<string, string>;
  markers: Record<string, string>;
  setLightMode: (toMapTime: MapTimeType) => void;
  shouldUseDarkMode: boolean;
};

export const MarkerEnum = {
  LOCATION: "location",
  HOME: "home",
} as const;
// export const MarkerValues = [MarkerEnum.LOCATION, MarkerEnum.HOME];
// export type MarkerType = (typeof MarkerValues)[number];

export const useMapHook = ({
  map,
}: {
  map?: RefObject<Map | null>;
}): [MapMethods, boolean, Error | undefined] => {
  const [userLoading] = useState(false);
  const [error] = useState<Error>();
  const shouldUseDarkMode = darkMode();

  // const { performanceMode, setPerformanceMode } = useUserStore(
  //   useShallow(({ performanceMode, setPerformanceMode }) => ({
  //     performanceMode,
  //     setPerformanceMode,
  //   })),
  // );

  const mapStyles = useMemo(() => {
    return {
      streets: "mapbox://styles/mapbox/streets-v12",
      basic: "mapbox://styles/mapbox/basic-v8",
      bright: "mapbox://styles/mapbox/bright-v8",
      grey: shouldUseDarkMode
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/light-v11",
      satelliteStreets: "mapbox://styles/mapbox/satellite-v9",
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
      outdoors: "mapbox://styles/mapbox/outdoors-v12",
      nav: shouldUseDarkMode
        ? "mapbox://styles/mapbox/navigation-night-v1"
        : "mapbox://styles/mapbox/navigation-day-v1",
      pink: "mapbox://styles/jchumtl/clnfdhrsc080001qi3ye8e8mj",
      standardStudioDawn: "mapbox://styles/jchumtl/clr05ebof00tu01nva1xxag8p",
      standardStudioDusk: "mapbox://styles/jchumtl/clr05vdp400f401qvgtdc5czu",
      standardStudioNight: "mapbox://styles/jchumtl/clr05wq8w00t501qrcc2h3gzw",
      standardStudioDay: "mapbox://styles/jchumtl/clr05sec300th01ql91z593w2",
      standard: "mapbox://styles/mapbox/standard",
    };
  }, [shouldUseDarkMode]);

  const markers = useMemo(() => {
    return {
      [MarkerEnum.LOCATION]: renderToStaticMarkup(
        <CurrentLocationPinIcon
          className={"h-10 w-10 fill-white stroke-blue-500"}
        />,
      ),
      [MarkerEnum.HOME]: renderToStaticMarkup(
        <AnimatedHomeIcon className={"fill-blue-500 stroke-white"} />,
      ),
    };
  }, []);

  const addMarker = useCallback<MapMethods["addMarker"]>(
    (htmlElement, currentMarker, setCurrentMarker, coords, save) => {
      if (!map?.current) return;
      const element = document.createElement("div");
      element.className = "marker";
      element.innerHTML = htmlElement;

      const marker = new Marker({
        element,
        draggable: !save,
        clickTolerance: 40,
      }).setLngLat([coords.lng, coords.lat]);

      if (save) {
        if (currentMarker) {
          currentMarker.setLngLat([coords.lng, coords.lat]);
        } else {
          setCurrentMarker(marker);
          marker.addTo(map.current);
        }
      } else marker.addTo(map.current);
    },
    [map],
  );

  // TODO: check if need to check if map is loading
  // (as well as for removePerformanceLayer, togglePerformanceLayer,
  // triggerNorth, and setLightMode)
  const flyTo = useCallback<MapMethods["flyTo"]>(
    (coords, zoom = 15) => {
      if (map?.current)
        map.current.flyTo({ center: [coords.lng, coords.lat], zoom });
    },
    [map],
  );

  // TODO: fix performance layer actions
  const removePerformanceLayer = useCallback<
    MapMethods["removePerformanceLayer"]
  >(() => {
    if (map?.current) map.current.removeLayer("add-3d-buildings");
  }, [map]);

  const addPerformanceLayer = useCallback<
    MapMethods["addPerformanceLayer"]
  >(() => {}, []);

  const togglePerformanceLayer = useCallback<
    MapMethods["togglePerformanceLayer"]
  >((toggleOn) => {
    // if (map?.current && !mapLoading) {
    //   if (!toggleOn && map.current.getLayer("add-3d-buildings"))
    //     removePerformanceLayer();
    //   else if (toggleOn) addPerformanceLayer();
    // }
    console.log(toggleOn);
  }, []);

  const updatePerformance = useCallback<
    MapMethods["updatePerformance"]
  >(async () => {
    // setPerformanceMode(!performanceMode);
  }, []);

  // TODO: move geolocator function from map.tsx
  const triggerGeolocator = useCallback<MapMethods["triggerGeolocator"]>(() => {
    return;
  }, []);

  const triggerNorth = useCallback<MapMethods["triggerNorth"]>(() => {
    if (map?.current) map.current.resetNorth({ duration: 2000 });
  }, [map]);

  const setLightMode = useCallback(
    (mapTime: MapTimeType) => {
      if (map?.current)
        map.current.setConfigProperty("basemap", "lightPreset", mapTime);
    },
    [map],
  );

  return [
    {
      addMarker,
      flyTo,
      togglePerformanceLayer,
      addPerformanceLayer,
      removePerformanceLayer,
      triggerGeolocator,
      triggerNorth,
      updatePerformance,
      mapStyles,
      markers,
      setLightMode,
      shouldUseDarkMode,
    },
    userLoading,
    error,
  ];
};