import type { Metadata } from "next";
import { Providers } from "@/providers/providers";
import "./globals.css";
import { PropsWithChildren } from "react";
import { montserrat } from "@/components/fonts";
import { Header } from "@/components/header/header";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Voyageurs",
  description: "Plan a trip as an ordered list of places on the map",
};

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <html lang={"en"} className={"bg-background-grey"}>
      <head>
        <Script
          src="//unpkg.com/react-scan/dist/auto.global.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${montserrat.className} h-full antialiased`}>
        <main className="relative h-dvh w-screen">
          <Providers>
            <Header />
            <div className="h-full">{children}</div>
          </Providers>
        </main>
      </body>
    </html>
  );
}