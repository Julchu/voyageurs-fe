"use client";

import { NavigationMenu } from "@base-ui/react/navigation-menu";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import {
  popupArrow,
  popupMotion,
  popupSurface,
} from "@/components/ui/popup-styles";

const navigationLinks = [
  {
    href: "/",
    title: "Map",
    description: "Plan a trip as an ordered list of places.",
  },
  {
    href: "/searches",
    title: "Searches",
    description: "Saved address searches",
  },

  {
    href: "/stops",
    title: "Trip stops",
    description: "Edit details of your current trip stops",
  },
  {
    href: "/calendar",
    title: "Calendar",
    description: "Plan time slots and opening hours",
  },
] as const;

export const LinksNavigationMenu = () => {
  const pathname = usePathname();
  const links = navigationLinks.filter((link) => link.href !== pathname);

  return (
    <NavigationMenu.Root className="text-neutral-950">
      <NavigationMenu.List className="m-0 list-none">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger
            className={
              "flex cursor-pointer items-center rounded-xl bg-blue-500/50 px-4 py-2 text-2xl font-bold tracking-widest text-white hover:bg-blue-500 focus-visible:bg-blue-500 data-popup-open:bg-blue-500 motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out"
            }
          >
            Voyageurs
          </NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-2">
              {links.map((link) => (
                <li key={link.href}>
                  <NavigationMenu.Link
                    className={
                      "group relative block h-full w-full rounded-lg p-2 text-left text-inherit no-underline hover:bg-blue-500 hover:text-white focus-visible:bg-blue-500 focus-visible:text-white focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-500 motion-reduce:transition-none"
                    }
                    closeOnClick
                    render={<NextLink href={link.href} />}
                  >
                    <span className="m-0 block text-sm leading-4 font-medium tracking-widest">
                      {link.title}
                    </span>
                    <p className="m-0 text-sm text-neutral-500 transition-colors duration-150 group-hover:text-white/80 group-focus-visible:text-white/80 motion-reduce:transition-none">
                      {link.description}
                    </p>
                  </NavigationMenu.Link>
                </li>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          align="start"
          sideOffset={16}
          collisionPadding={{ top: 5, bottom: 5, left: 16, right: 16 }}
          collisionAvoidance={{ side: "none" }}
          className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom] duration-[var(--duration)] ease-[var(--easing)] [--duration:0.35s] [--easing:cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none"
        >
          <NavigationMenu.Popup
            className={cn(
              popupSurface,
              popupMotion,
              "relative h-[var(--popup-height)] w-[var(--popup-width)] rounded-xl",
            )}
          >
            <NavigationMenu.Arrow
              className={cn(
                popupArrow,
                "transition-[left,right] duration-[var(--duration)] ease-[var(--easing)]",
              )}
            />
            <NavigationMenu.Viewport className="relative h-full w-full overflow-hidden" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
};
