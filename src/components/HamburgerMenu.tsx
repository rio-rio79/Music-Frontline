"use client";

import { useState } from "react";
import Link from "next/link";

type MenuItem = {
  name: string;
  href: string;
};

type HamburgerMenuProps = {
  items: MenuItem[];
};

export default function HamburgerMenu({
  items,
}: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="hamburger"
        onClick={() => setOpen(!open)}
        aria-label="メニュー"
      >
        ☰
      </button>

      <nav
        className={`sidebar ${open ? "open" : ""}`}
      >
        <ul>
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        
      </nav>

      {open && (
        <div
          className="overlay"
          onClick={() => setOpen(false)}
        />
      )}
    
    
 </>
  );
}
