"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Search,
  User,
  Radio,
  ChevronDown,
  Menu,
  X,
  Phone,
} from "lucide-react";
import { SITE_NAME, SITE_PHONE } from "@/lib/constants";
import { setCurrencyAction } from "@/app/actions/currency";

type NavItem = { name: string; slug: string };

export function Header({
  cartCount = 0,
  currency,
  dualCurrency = true,
  categories = [],
  industries = [],
}: {
  cartCount?: number;
  currency: "CAD" | "USD";
  dualCurrency?: boolean;
  categories?: NavItem[];
  industries?: NavItem[];
}) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<"categories" | "industries" | null>(
    null,
  );
  const [renderMenu, setRenderMenu] = useState<"categories" | "industries" | null>(
    null,
  );
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (openMenu) return;

    if (!renderMenu) return;

    unmountTimerRef.current = setTimeout(() => setRenderMenu(null), 250);
    return () => {
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
        unmountTimerRef.current = null;
      }
    };
  }, [openMenu, renderMenu]);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openMegaMenu(menu: "categories" | "industries") {
    clearCloseTimer();
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = null;
    }
    setOpenMenu(menu);
    setRenderMenu(menu);
  }

  function scheduleCloseMegaMenu() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpenMenu(null), 120);
  }
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  async function switchCurrency(next: "CAD" | "USD") {
    await setCurrencyAction(next);
    router.refresh();
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Announcement bar */}
      <div className="bg-slate-900 text-white">
        <div className="container-page flex h-9 items-center justify-between text-xs font-medium sm:text-[13px]">
          <p className="tracking-wide">
            Free Shipping on Qualifying Orders &middot; No Monthly Fees &middot;
            Expert US &amp; CA Support
          </p>
          <a
            href={`tel:${SITE_PHONE.replace(/[^\d+]/g, "")}`}
            className="hidden items-center gap-1.5 text-slate-200 transition hover:text-white sm:flex"
          >
            <Phone className="h-3.5 w-3.5" />
            {SITE_PHONE}
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-slate-200">
        <div className="container-page flex h-20 items-center gap-4 py-3">
          <button
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link href="/" className="flex items-center gap-2 font-extrabold text-slate-900">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <Radio className="h-6 w-6" />
            </span>
            <span className="text-lg leading-tight tracking-tight sm:text-xl">
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop search */}
          <form
            onSubmit={submitSearch}
            className="ml-4 hidden flex-1 items-center lg:flex"
          >
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search radios, accessories, brands..."
                className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {dualCurrency ? (
              <div className="hidden items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 sm:flex">
                {(["CAD", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => switchCurrency(c)}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                      currency === c
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}

            <Link
              href="/account"
              aria-label="Account"
              className="grid h-10 w-10 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100"
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative grid h-10 w-10 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop nav with mega menus */}
      <nav
        className="relative hidden border-b border-slate-200 bg-white lg:block"
        onMouseLeave={scheduleCloseMegaMenu}
      >
        <div className="container-page flex items-center gap-1">
          <Link
            href="/search"
            className="px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:text-blue-600"
          >
            All Products
          </Link>

          <MegaTrigger
            label="Categories"
            active={openMenu === "categories"}
            onEnter={() => openMegaMenu("categories")}
          />
          <MegaTrigger
            label="Industries"
            active={openMenu === "industries"}
            onEnter={() => openMegaMenu("industries")}
          />

          <Link
            href="/about"
            className="px-4 py-3 text-sm font-semibold text-slate-700 transition hover:text-blue-600"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="px-4 py-3 text-sm font-semibold text-slate-700 transition hover:text-blue-600"
          >
            Contact
          </Link>
          <Link
            href="/shipping"
            className="px-4 py-3 text-sm font-semibold text-slate-700 transition hover:text-blue-600"
          >
            Shipping
          </Link>
        </div>

        {renderMenu && (
          <div
            className={`absolute inset-x-0 top-full z-50 border-t border-slate-100 bg-white shadow-xl transition-all duration-250 ease-out ${
              openMenu
                ? "mega-menu-panel translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0"
            }`}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleCloseMegaMenu}
          >
            <div
              key={renderMenu}
              className="container-page grid grid-cols-2 gap-x-8 gap-y-2 py-6 md:grid-cols-3"
            >
              {(renderMenu === "categories" ? categories : industries).map(
                (item, index) => (
                <Link
                  key={item.slug}
                  href={`/${renderMenu}/${item.slug}`}
                  onClick={() => setOpenMenu(null)}
                  className="mega-menu-item group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-blue-600"
                  style={{ animationDelay: `${index * 35}ms` }}
                >
                  {item.name}
                  <ChevronDown className="h-4 w-4 -rotate-90 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-blue-500" />
                </Link>
              ),
              )}
              {(renderMenu === "categories" ? categories : industries).length ===
                0 && (
                <p className="px-3 py-2 text-sm text-slate-400">Coming soon.</p>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-b border-slate-200 bg-white lg:hidden">
          <div className="container-page space-y-4 py-4">
            <form onSubmit={submitSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
            </form>

            <MobileGroup
              title="Categories"
              base="categories"
              items={categories}
              onNavigate={() => setMobileOpen(false)}
            />
            <MobileGroup
              title="Industries"
              base="industries"
              items={industries}
              onNavigate={() => setMobileOpen(false)}
            />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"
              >
                Contact
              </Link>
            </div>

            {dualCurrency ? (
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm font-medium text-slate-600">Currency</span>
                <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5">
                  {(["CAD", "USD"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => switchCurrency(c)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        currency === c ? "bg-blue-600 text-white" : "text-slate-500"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}

function MegaTrigger({
  label,
  active,
  onEnter,
}: {
  label: string;
  active: boolean;
  onEnter: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      className={`flex items-center gap-1 px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
        active ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
      }`}
    >
      {label}
      <ChevronDown
        className={`h-4 w-4 transition-transform duration-300 ease-out ${
          active ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

function MobileGroup({
  title,
  base,
  items,
  onNavigate,
}: {
  title: string;
  base: string;
  items: NavItem[];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold text-slate-800"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-slate-100 p-1">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/${base}/${item.slug}`}
              onClick={onNavigate}
              className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
