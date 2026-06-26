"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Layers,
  Building2,
  ShoppingCart,
  Users,
  ShieldCheck,
  ClipboardList,
  Settings,
  Star,
  BookOpen,
  Receipt,
  Wallet,
  RotateCcw,
  FileBarChart,
  MessageSquare,
  Images,
  DatabaseBackup,
  Menu,
  X,
} from "lucide-react";

const baseLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/hero", label: "Home Slides", icon: Images },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/featured", label: "Featured", icon: Star },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/industries", label: "Industries", icon: Building2 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/leads", label: "Leads", icon: MessageSquare },
  { href: "/admin/accounting/ledger", label: "Ledger", icon: BookOpen },
  { href: "/admin/accounting/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/accounting/refunds", label: "Refunds", icon: RotateCcw },
  { href: "/admin/accounting/payments", label: "Payments", icon: Wallet },
  { href: "/admin/accounting/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/accounting/pnl", label: "P&L", icon: FileBarChart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

type AdminLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

function useAdminLinks(isSuperAdmin: boolean): AdminLink[] {
  return isSuperAdmin
    ? [
        ...baseLinks,
        { href: "/admin/audit", label: "Audit", icon: ClipboardList },
        { href: "/admin/backup", label: "Backup", icon: DatabaseBackup },
      ]
    : [...baseLinks];
}

function NavLinks({
  links,
  pathname,
  onNavigate,
}: {
  links: AdminLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive =
          "exact" in link && link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminNavMobile({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = useAdminLinks(isSuperAdmin);

  return (
    <>
      <button
        type="button"
        className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="font-bold dark:text-white">Admin Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <NavLinks links={links} pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export function AdminNavSidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const links = useAdminLinks(isSuperAdmin);

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <NavLinks links={links} pathname={pathname} />
      </div>
    </aside>
  );
}
