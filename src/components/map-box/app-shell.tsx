"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MapComponents } from "@/components/map-box/map-components";

// TODO: get initial coords
// Keep the map mounted while navigating between pages.
export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const onMap = pathname === "/";
  const onPlanner = pathname === "/trips" || pathname === "/calendar";

  return (
    <div className="relative h-full">
      <div
        className={
          onMap ? "absolute inset-0" : "pointer-events-none absolute inset-0"
        }
        aria-hidden={!onMap}
      >
        <MapComponents />
      </div>
      {onMap ? null : (
        <div
          className={
            onPlanner
              ? "absolute inset-x-4 top-20 bottom-4 isolate overflow-hidden rounded-2xl bg-white text-neutral-950 shadow-sm"
              : "absolute inset-0 bg-none"
          }
        >
          {children}
        </div>
      )}
    </div>
  );
};