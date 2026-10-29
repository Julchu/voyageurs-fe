import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;

export const googleLoadLibrary = <T extends keyof google.maps.ImportLibraryMap>(
  key: string,
  library: T,
): Promise<google.maps.ImportLibraryMap[T]> => {
  if (!configured) {
    setOptions({ key, v: "beta" });
    configured = true;
  }
  return importLibrary(library);
};
