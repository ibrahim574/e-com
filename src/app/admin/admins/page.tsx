import { requireAdmin, isSuperAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { CreateAdminForm } from "@/components/admin/create-admin-form";
import { AdminRowActions } from "@/components/admin/admin-row-actions";

export const dynamic = "force-dynamic";

export default async function AdminAdminsPage() {
  const session = await requireAdmin();
  const isSuper = isSuperAdminRole(session.user.role);

  // Regular admins never see SUPER_ADMIN rows.
  const where = isSuper
    ? { role: { in: ["ADMIN", "SUPER_ADMIN"] as ("ADMIN" | "SUPER_ADMIN")[] } }
    : { role: "ADMIN" as const };

  const admins = await prisma.user.findMany({
    where,
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Admins
        </h1>
        <p className="mt-1 text-slate-600">
          Manage who can access the admin panel.
          {!isSuper && (
            <>
              {" "}
              <span className="text-xs text-slate-500">
                (Super admins are hidden — only super admins can promote, demote, or delete admins.)
              </span>
            </>
          )}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Admin</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Added</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const isSelf = a.id === session.user.id;
              return (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {a.name ?? "Unnamed"}
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                          you
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{a.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {a.role === "SUPER_ADMIN" ? (
                      <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                        Super Admin
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <AdminRowActions
                      userId={a.id}
                      role={a.role as "ADMIN" | "SUPER_ADMIN"}
                      isSelf={isSelf}
                      isSuperAdmin={isSuper}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CreateAdminForm />
    </div>
  );
}
