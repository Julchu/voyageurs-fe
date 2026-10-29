import { RefObject } from "react";
import type { Map } from "mapbox-gl";

export type MapNavigation = {
  map?: RefObject<Map | null>;
};