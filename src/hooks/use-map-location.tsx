import { type RefObject, useEffect, useState } from "react";
import { type Map as MapboxMap, Marker } from "mapbox-gl";
import { renderToStaticMarkup } from "react-dom/server";
import { AnimatedHomeIcon } from "@/components/ui/icons/home-icon";
import { useUserStore } from "@/providers/user-store-provider";

export const useMapLocation = (
  map: RefObject<MapboxMap | null>,
  mapLoading: boolean,
) => {
  const lastLocation = useUserStore((state) => state.lastLocation);
  const setLastLocation = useUserStore((state) => state.setLastLocation);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (!map.current || mapLoading || !lastLocation) return;

    const element = document.createElement("div");
    element.className = "marker";
    element.innerHTML = renderToStaticMarkup(
      <AnimatedHomeIcon className="fill-blue-500 stroke-white" />,
    );
    const marker = new Marker({ element, clickTolerance: 40 })
      .setLngLat([lastLocation.lng, lastLocation.lat])
      .addTo(map.current);

    return () => {
      marker.remove();
    };
  }, [map, mapLoading, lastLocation]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;
    const onMoveEnd = () => setLocationLoading(false);
    mapInstance.on("moveend", onMoveEnd);
    return () => {
      mapInstance.off("moveend", onMoveEnd);
    };
  }, [map, mapLoading]);

  const triggerGeolocator = () => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords: { longitude: lng, latitude: lat } }) => {
        // A location request can finish after the map has unmounted.
        if (map.current !== mapInstance) return;
        const coordinates = { lng, lat };
        setLastLocation(coordinates);
        mapInstance.flyTo({ center: [lng, lat], zoom: 15 });
        if (!mapInstance.isMoving()) setLocationLoading(false);
      },
      (error) => {
        if (map.current !== mapInstance) return;
        console.error("Error geolocating", error);
        setLocationLoading(false);
      },
      { enableHighAccuracy: false },
    );
  };

  return { locationLoading, triggerGeolocator };
};
