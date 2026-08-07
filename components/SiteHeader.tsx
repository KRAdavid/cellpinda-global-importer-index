"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon, SearchIcon } from "@/components/Icons";
import { siteContent } from "@/lib/content";

const AskCellpinda = dynamic(() =>
  import("@/components/AskCellpinda").then((module) => module.AskCellpinda),
);

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const askActive = pathname === "/ask-cellpinda/" || pathname === "/ask-cellpinda";
  const homeActive = pathname === "/";

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner page-shell">
          <Link className="brand" href="/" onClick={() => setOpen(false)}>
            <span className="brand__mark" aria-hidden="true">
              G
            </span>
            <span className="brand__copy">
              <strong>{siteContent.brand.shortName}</strong>
              <small>Global importer intelligence</small>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {siteContent.navigation.slice(0, 7).map((item) => {
              const href = `/${item.slug}/`;
              const active = pathname === href || pathname === `/${item.slug}`;
              return (
                <Link aria-current={active ? "page" : undefined} href={href} key={item.slug}>
                  {item.shortLabel}
                </Link>
              );
            })}
          </nav>

          <div className="site-header__actions">
            <Link className="header-search" href="/global-search/" aria-label="Global search">
              <SearchIcon />
            </Link>
            <Link
              aria-current={askActive ? "page" : undefined}
              className="button button--small button--primary"
              href="/ask-cellpinda/"
            >
              Ask Cellpinda
            </Link>
            <a className="button button--small button--dark" href={siteContent.contact.href}>
              {siteContent.contact.label}
            </a>
            <button
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label="Toggle navigation"
              className="mobile-menu-button"
              onClick={() => setOpen((value) => !value)}
              type="button"
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        <nav
          className="mobile-nav"
          data-open={open ? "true" : "false"}
          id="mobile-navigation"
          aria-label="Mobile navigation"
        >
          <div className="page-shell mobile-nav__grid">
            <Link href="/" onClick={() => setOpen(false)}>
              Home Dashboard
            </Link>
            <Link href="/ask-cellpinda/" onClick={() => setOpen(false)}>
              Ask Cellpinda
            </Link>
            {siteContent.navigation.map((item) => (
              <Link href={`/${item.slug}/`} key={item.slug} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/system-status/" onClick={() => setOpen(false)}>
              Index Status
            </Link>
          </div>
        </nav>
      </header>
      {homeActive ? <AskCellpinda embedded /> : null}
    </>
  );
}
