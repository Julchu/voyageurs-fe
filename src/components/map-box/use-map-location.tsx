import { useEffect, useRef, useState } from "react";
import { Marker } from "mapbox-gl";
import { createRoot } from "react-dom/client";
import { useMapStore } from "@/components/map-box/map-store";
import { flyTo } from "@/components/map-box/map-actions";
import { useUserStore } from "@/providers/user-store-provider";
import { AnimatedPinFilledIcon } from "@/components/ui/icons/pin-icons";

export const useMapLocation = () => {
  const map = useMapStore((state) => state.map);
  const lastLocation = useUserStore((state) => state.lastLocation);
  const setLastLocation = useUserStore((state) => state.setLastLocation);
  const [locationLoading, setLocationLoading] = useState(false);
  const currentMap = useRef(map);

  useEffect(() => {
    currentMap.current = map;
    return () => {
      currentMap.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!map || !lastLocation) return;

    const element = document.createElement("div");
    element.className = "marker";
    const root = createRoot(element);
    root.render(
      <AnimatedPinFilledIcon className="h-6 w-6 fill-blue-500 stroke-none" />,
    );
    const marker = new Marker({ element, clickTolerance: 40 })
      .setLngLat([lastLocation.lng, lastLocation.lat])
      .addTo(map);

    return () => {
      marker.remove();
      // A root can't unmount while React is committing.
      queueMicrotask(() => root.unmount());
    };
  }, [map, lastLocation]);

  useEffect(() => {
    if (!map) return;
    const onMoveEnd = () => setLocationLoading(false);
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [map]);

  const triggerGeolocator = () => {
    if (!map) return;
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords: { longitude: lng, latitude: lat } }) => {
        // A location request can finish after the map has unmounted.
        if (currentMap.current !== map) return;
        setLastLocation({ lng, lat });
        flyTo(map, { lng, lat });
        if (!map.isMoving()) setLocationLoading(false);
      },
      (error) => {
        if (currentMap.current !== map) return;
        console.error("Error geolocating", error);
        setLocationLoading(false);
      },
      { enableHighAccuracy: false },
    );
  };

  return { locationLoading, triggerGeolocator };
};
