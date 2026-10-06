import Link from "next/link";
import { SiteLogo } from "./site-logo";

const pages = [
  { href: "/", label: "Viime yö" },
  { href: "/uutiset", label: "Uutiset" },
  { href: "/tilastot", label: "Tilastot" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <Link href="/" className="site-logo site-footer-logo">
              <SiteLogo />
            </Link>
            <p>Suomalaispelaajien yön tilastot, kauden luvut ja uutiset.</p>
          </div>
          <nav className="site-footer-nav" aria-label="Alatunniste">
            {pages.map((page) => (
              <Link key={page.href} href={page.href}>
                {page.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="site-footer-meta">
          <span>© 2026 Night Recap</span>
          <span>Lähde: NHL</span>
        </div>
      </div>
    </footer>
  );
}
