import type { ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";

const popupClass =
  "flex origin-[var(--transform-origin)] flex-col rounded-2xl bg-white p-2 text-black shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] outline-hidden transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none";

const itemClass =
  "group flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm leading-4 text-black outline-hidden transition-colors duration-150 select-none data-disabled:cursor-default data-disabled:text-neutral-500 data-highlighted:bg-blue-500 data-highlighted:text-white motion-reduce:transition-none";

/** Portal + positioner + popup, aligned to the trigger's end. */
export const MenuPopup = ({ children }: { children: ReactNode }) => (
  <Menu.Portal>
    <Menu.Positioner align="end" sideOffset={8} className="z-50 outline-hidden">
      <Menu.Popup className={popupClass}>{children}</Menu.Popup>
    </Menu.Positioner>
  </Menu.Portal>
);

export const MenuItem = ({ className, ...props }: Menu.Item.Props) => (
  <Menu.Item className={cn(itemClass, className as string)} {...props} />
);
