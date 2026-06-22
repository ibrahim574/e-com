import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const [productCount, categoryCount, industryCount, orderCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.industry.count(),
      prisma.order.count(),
    ]);

  const stats = [
    { label: "Products", value: productCount, href: "/admin/products" },
    { label: "Categories", value: categoryCount, href: "/admin/categories" },
    { label: "Industries", value: industryCount, href: "/admin/industries" },
    { label: "Orders", value: orderCount, href: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-slate-600">Welcome, {session.user.name ?? session.user.email}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
