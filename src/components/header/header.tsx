import { LinksNavigationMenu } from "@/components/header/links-navigation-menu";
import { Hamburger } from "@/components/header/hamburger";

export const Header = () => {
  return (
    <header className="pointer-events-none absolute inset-0 z-1 p-4">
      <div
        className={
          "pointer-events-auto flex h-12 flex-row items-center justify-between gap-3 drop-shadow-lg"
        }
      >
        <LinksNavigationMenu />
        <Hamburger />
      </div>
    </header>
  );
};