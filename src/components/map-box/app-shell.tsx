"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { MapComponents } from "@/components/map-box/map-components";

// Workaround to keep map mounted
// TODO: get initial coords
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onMap = pathname === "/";

  return (
    <div className="relative h-full">
      <div
        className={
          onMap
            ? "absolute inset-0"
            : "pointer-events-none invisible absolute inset-0"
        }
        aria-hidden={!onMap}
      >
        <MapComponents />
      </div>
      {onMap ? null : (
        <div className="bg-background-grey absolute inset-0 z-10">
          {children}
        </div>
      )}
    </div>
  );
}