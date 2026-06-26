import { requireSuperAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { RedirectsManager } from "@/components/admin/redirects-manager";

export const dynamic = "force-dynamic";

export default async function AdminRedirectsPage() {
  await requireSuperAdmin();

  const redirects = await prisma.redirect.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Redirect Manager
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Create 301/302/307/308 redirects for old or changed URLs. Changes take
          effect within a minute.
        </p>
      </div>
      <RedirectsManager redirects={redirects} />
    </div>
  );
}
