import { BrandMenu } from "@/components/header/brand-menu";
import { Hamburger } from "@/components/header/hamburger";

export const Header = () => {
  return (
    <header className="pointer-events-none absolute inset-0 z-30">
      <div className="pointer-events-auto">
        <BrandMenu />
      </div>
      <div className="pointer-events-auto absolute top-4 right-4 h-10">
        <Hamburger />
      </div>
    </header>
  );
};
