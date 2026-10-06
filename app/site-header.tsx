"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogo } from "./site-logo";

const pages = [
  { href: "/", label: "Viime yö" },
  { href: "/uutiset", label: "Uutiset" },
  { href: "/tilastot", label: "Tilastot" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo">
          <SiteLogo />
        </Link>
        <nav className="site-nav" aria-label="Sivut">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              aria-current={pathname === page.href ? "page" : undefined}
            >
              {page.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
