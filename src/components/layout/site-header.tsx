"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/mou-partners", label: "MoU Partners" },
  { href: "/global-engagement-map", label: "Global Engagement Map" },
  { href: "/past-activities", label: "Past Activities" },
  { href: "/chairman-speeches", label: "Authority’s Speeches" },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="identity" href="/" aria-label="TRAI IR home">
          <span>TRAI IR</span>
          <small>International Relations</small>
        </Link>
        <button className="menu-toggle" type="button" aria-expanded={isOpen} aria-controls="primary-navigation" onClick={() => setIsOpen(!isOpen)}>
          <span className="sr-only">{isOpen ? "Close" : "Open"} navigation menu</span>
          <span aria-hidden="true" className="menu-icon"><i /><i /><i /></span>
        </button>
        <nav id="primary-navigation" className={isOpen ? "primary-nav is-open" : "primary-nav"} aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className={item.href === pathname ? "active" : undefined} aria-current={item.href === pathname ? "page" : undefined} onClick={() => setIsOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
