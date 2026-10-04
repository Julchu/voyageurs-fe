import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Map, Marker } from "mapbox-gl";
import { useUserStore } from "@/providers/user-store-provider";
import { Coordinates, MapTimeType } from "@/utils/interfaces";
import { renderToStaticMarkup } from "react-dom/server";
import { CurrentLocationIcon } from "@/components/ui/icons/map-pins";
import { useShallow } from "zustand/react/shallow";

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
};

export const useMapHook = ({
  map,
  mapLoading,
  setMapLoading: _setMapLoading,
  shouldUseDarkMode,
  currentMapTimeMode,
}: {
  map?: RefObject<Map | null>;
  mapLoading?: boolean;
  setMapLoading?: Dispatch<SetStateAction<boolean>>;
  shouldUseDarkMode?: boolean;
  currentMapTimeMode?: MapTimeType;
}): [MapMethods, boolean, Error | undefined] => {
  const [userLoading] = useState(false);
  const [error] = useState<Error>();
  const { performanceMode, setPerformanceMode } = useUserStore(
    useShallow(({ performanceMode, setPerformanceMode }) => ({
      performanceMode,
      setPerformanceMode,
    })),
  );

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
      location: renderToStaticMarkup(
        <CurrentLocationIcon className={"stroke-blue-500"} />,
      ),
      location2: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-5 h-5 fill-blue-600 absolute">
                  <path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-5 h-5 fill-blue-600 animate-ping">
                  <path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />
                </svg>`,
      home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-5 h-5 fill-blue-600 absolute">
              <path fill-rule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clip-rule="evenodd" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-5 h-5 fill-blue-600 animate-ping">
              <path fill-rule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clip-rule="evenodd" />
            </svg>`,
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

  const flyTo = useCallback<MapMethods["flyTo"]>(
    (coords, zoom = 15) => {
      if (map?.current && !mapLoading)
        map.current.flyTo({ center: [coords.lng, coords.lat], zoom });
    },
    [map, mapLoading],
  );

  // TODO: fix performance layer actions
  const removePerformanceLayer = useCallback<
    MapMethods["removePerformanceLayer"]
  >(() => {
    if (map?.current && !mapLoading)
      map.current.removeLayer("add-3d-buildings");
  }, [map, mapLoading]);

  const addPerformanceLayer = useCallback<
    MapMethods["addPerformanceLayer"]
  >(() => {}, []);

  const togglePerformanceLayer = useCallback<
    MapMethods["togglePerformanceLayer"]
  >(
    (toggleOn) => {
      if (map?.current && !mapLoading) {
        if (!toggleOn && map.current.getLayer("add-3d-buildings"))
          removePerformanceLayer();
        else if (toggleOn) addPerformanceLayer();
      }
    },
    [addPerformanceLayer, map, mapLoading, removePerformanceLayer],
  );

  const triggerGeolocator = useCallback<MapMethods["triggerGeolocator"]>(() => {
    return;
  }, []);

  const triggerNorth = useCallback<MapMethods["triggerNorth"]>(() => {
    if (map?.current && !mapLoading) map.current.resetNorth({ duration: 2000 });
  }, [map, mapLoading]);

  const updatePerformance = useCallback<
    MapMethods["updatePerformance"]
  >(async () => {
    setPerformanceMode(!performanceMode);
  }, [performanceMode, setPerformanceMode]);

  const setLightMode = useCallback(
    (mapTime: MapTimeType) => {
      if (map?.current && !mapLoading)
        map.current.setConfigProperty("basemap", "lightPreset", mapTime);
    },
    [map, mapLoading],
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
    },
    userLoading,
    error,
  ];
};