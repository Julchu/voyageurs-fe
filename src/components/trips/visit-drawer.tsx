"use client";

import { Drawer } from "@base-ui/react/drawer";

export const visitDrawerHandle = Drawer.createHandle();

// Mounted with the map. Open it later with openVisitDrawer(); no control is wired yet.
export const VisitDrawer = () => {
  return (
    <Drawer.Root
      modal={false}
      disablePointerDismissal
      handle={visitDrawerHandle}
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className={
            "fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.2] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0"
          }
        />
        <Drawer.Viewport className="fixed inset-0 flex items-stretch justify-end">
          <Drawer.Popup
            className={
              "h-full w-[min(100%,24rem)] [transform:translateX(var(--drawer-swipe-movement-x))] overflow-y-auto overscroll-contain bg-white/95 p-4 text-neutral-950 shadow-xl transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)] data-swiping:select-none"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <Drawer.Title className="text-lg font-medium tracking-widest">
                Visited
              </Drawer.Title>
              <Drawer.Close className="text-sm text-neutral-500">
                Close
              </Drawer.Close>
            </div>
            <Drawer.Description className="mt-1 text-sm text-neutral-500">
              Start a trip to check off places.
            </Drawer.Description>
            <p className="mt-4 text-sm text-neutral-500">
              Nothing to check off yet.
            </p>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};