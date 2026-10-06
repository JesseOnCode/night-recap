import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsTicker } from "./news-ticker";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Night Recap",
    template: "%s — Night Recap",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body>
        <SiteHeader />
        <Suspense fallback={null}>
          <NewsTicker />
        </Suspense>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}