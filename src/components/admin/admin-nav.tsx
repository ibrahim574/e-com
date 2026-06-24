"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const baseLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/featured", label: "Featured", icon: Star },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/industries", label: "Industries", icon: Building2 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/accounting/ledger", label: "Ledger", icon: BookOpen },
  { href: "/admin/accounting/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/accounting/refunds", label: "Refunds", icon: RotateCcw },
  { href: "/admin/accounting/payments", label: "Payments", icon: Wallet },
  { href: "/admin/accounting/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminNav({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();

  const links = isSuperAdmin
    ? [
        ...baseLinks,
        {
          href: "/admin/audit",
          label: "Audit",
          icon: ClipboardList,
        } as const,
      ]
    : baseLinks;

  return (
    <nav className="flex flex-wrap gap-1 text-sm">
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
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
