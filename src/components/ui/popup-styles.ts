export const popupSurface =
  "bg-white text-neutral-950 shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)] outline-hidden";

export const popupMotion =
  "origin-(--transform-origin) transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none";

export const popupArrow =
  "relative block h-1.5 w-3 overflow-clip before:absolute before:bottom-0 before:left-1/2 before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:[transform:translate(-50%,50%)_rotate(45deg)] before:bg-white before:content-[''] data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180";

export const menuItem =
  "group flex cursor-pointer items-center gap-2 rounded-xl p-2 text-sm leading-4 outline-hidden transition-colors duration-150 select-none data-disabled:cursor-default data-disabled:text-neutral-500 data-highlighted:bg-blue-500 data-highlighted:text-white motion-reduce:transition-none";
