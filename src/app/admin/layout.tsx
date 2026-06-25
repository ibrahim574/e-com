import Link from "next/link";
import { UserCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { isAdminRole, isSuperAdminRole } from "@/lib/admin-guard";
import { getSiteSettings } from "@/lib/site-settings";
import { AdminNavMobile, AdminNavSidebar } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToastProvider } from "@/components/ui/toast-provider";
import { SiteLogo } from "@/components/layout/site-logo";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = isAdminRole(session?.user?.role);
  const isSuper = isSuperAdminRole(session?.user?.role);
  const settings = isAdmin ? await getSiteSettings() : null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {isAdmin && (
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-3 px-4">
              <div className="flex items-center gap-3">
                <AdminNavMobile isSuperAdmin={isSuper} />
                <div className="flex items-center gap-2">
                  <SiteLogo
                    logoUrl={settings?.siteLogoUrl}
                    size="sm"
                    showName={false}
                  />
                  <Link
                    href="/admin"
                    className="hidden font-bold dark:text-white sm:inline"
                  >
                    Admin Panel
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/admin/account"
                  className="hidden items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium sm:inline-flex dark:border-slate-700 dark:text-slate-300"
                  title={session?.user?.email}
                >
                  <UserCircle className="h-4 w-4" />
                  <span className="max-w-[140px] truncate">{session?.user?.email}</span>
                </Link>
                <Link
                  href="/"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium dark:border-slate-700 dark:text-slate-300"
                >
                  Store
                </Link>
              </div>
            </div>
          </header>
        )}
        <div className="mx-auto flex max-w-[90rem] gap-6 px-4 py-6">
          {isAdmin && <AdminNavSidebar isSuperAdmin={isSuper} />}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
