"use client";

import { NavigationMenu } from "@base-ui/react/navigation-menu";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/providers/user-store-provider";

const browseLinks = [
  {
    href: "/",
    title: "Map",
    description: "Plan a trip as an ordered list of places.",
  },
  {
    href: "/searches",
    title: "Searches",
    description: "Saved address searches.",
  },
] as const;

const listLinks = [
  {
    href: "/trips",
    title: "Trips",
    description: "Saved trips and visit order.",
  },
] as const;

type NavLink = {
  href: string;
  title: string;
  description?: string;
};

export const LinksNavigationMenu = () => {
  const pathname = usePathname();
  const userInfo = useUserStore(({ userInfo }) => userInfo);
  const links: readonly NavLink[] = (
    userInfo ? [...browseLinks, ...listLinks] : browseLinks
  ).filter((link) => link.href !== pathname);

  return (
    <NavigationMenu.Root className="text-neutral-950">
      <NavigationMenu.List className="m-0 list-none">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger
            className={
              "flex cursor-pointer items-center rounded-md bg-blue-500 px-4 py-2 text-2xl font-bold tracking-widest text-white opacity-50"
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
                      "group initialCoords-visible:-outline-offset-1 initialCoords-visible:outline-blue-500 relative block h-full w-full rounded-md p-2 text-left text-inherit no-underline hover:bg-blue-500 hover:text-white focus-visible:outline-2"
                    }
                    closeOnClick
                    render={<NextLink href={link.href} />}
                  >
                    <h5 className="m-0 text-sm leading-4 font-medium tracking-widest">
                      {link.title}
                    </h5>
                    <p className="m-0 text-sm text-neutral-500 group-hover:text-white/80">
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
          sideOffset={10}
          collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}
          collisionAvoidance={{ side: "none" }}
          className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom] duration-[var(--duration)] ease-[var(--easing)] before:absolute before:content-[''] data-instant:transition-none data-[side=bottom]:before:top-[-10px] data-[side=bottom]:before:right-0 data-[side=bottom]:before:left-0 data-[side=bottom]:before:h-2.5 data-[side=left]:before:top-0 data-[side=left]:before:right-[-10px] data-[side=left]:before:bottom-0 data-[side=left]:before:w-2.5 data-[side=right]:before:top-0 data-[side=right]:before:bottom-0 data-[side=right]:before:left-[-10px] data-[side=right]:before:w-2.5 data-[side=top]:before:right-0 data-[side=top]:before:bottom-[-10px] data-[side=top]:before:left-0 data-[side=top]:before:h-2.5"
          style={{
            ["--duration" as string]: "0.35s",
            ["--easing" as string]: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <NavigationMenu.Popup className="relative h-[var(--popup-height)] w-[var(--popup-width)] origin-[var(--transform-origin)] rounded-md bg-white text-neutral-950 shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] transition-[scale,opacity] duration-100 ease-out outline-none data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <NavigationMenu.Arrow className="relative block h-1.5 w-3 overflow-clip transition-[left,right] duration-[var(--duration)] ease-[var(--easing)] before:absolute before:bottom-0 before:left-1/2 before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:[transform:translate(-50%,50%)_rotate(45deg)] before:bg-white before:content-[''] data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180" />
            <NavigationMenu.Viewport className="relative h-full w-full overflow-hidden" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
};