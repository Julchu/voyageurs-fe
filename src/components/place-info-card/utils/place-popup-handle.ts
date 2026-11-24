import { Dialog } from "@base-ui/react/dialog";
import type { Place } from "@/types/place";

// Shared by the map, search, and card without a circular component import.
export const openPlacePopup = Dialog.createHandle<Place>();
