import { type FC } from "react";
import Link from "next/link";
import { montserrat } from "@/components/fonts";
import { Button } from "@/components/ui/button";

const Logo: FC = () => {
  return (
    <Link href="/">
      <Button
        className={`absolute top-5 left-5 h-9 cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-2xl font-bold tracking-widest text-white opacity-50 ${montserrat.className}`}
      >
        Voyageurs
      </Button>
    </Link>
  );
};

export default Logo;
