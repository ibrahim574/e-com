import Link from "next/link";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-100">
      {session?.user?.role === "ADMIN" && (
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-bold text-slate-900">
                Admin Panel
              </Link>
              <nav className="flex gap-4 text-sm">
                <Link href="/admin/products" className="text-slate-600 hover:text-blue-600">
                  Products
                </Link>
                <Link href="/admin/categories" className="text-slate-600 hover:text-blue-600">
                  Categories
                </Link>
                <Link href="/admin/industries" className="text-slate-600 hover:text-blue-600">
                  Industries
                </Link>
                <Link href="/admin/orders" className="text-slate-600 hover:text-blue-600">
                  Orders
                </Link>
              </nav>
            </div>
            <Link href="/" className="text-sm text-slate-600 hover:text-blue-600">
              View Store
            </Link>
          </div>
        </header>
      )}
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
