import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "STATUS",
  "PROMOTE",
  "DEMOTE",
  "PASSWORD",
  "SETTING",
] as const;

const ENTITY_TYPES = [
  "Product",
  "ProductVariant",
  "ProductOption",
  "Category",
  "Industry",
  "Order",
  "User",
  "SiteSettings",
] as const;

const PAGE_SIZE = 50;

const ACTION_COLOR: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700",
  STATUS: "bg-amber-50 text-amber-700",
  PROMOTE: "bg-purple-50 text-purple-700",
  DEMOTE: "bg-amber-50 text-amber-700",
  PASSWORD: "bg-slate-100 text-slate-700",
  SETTING: "bg-slate-100 text-slate-700",
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    actor?: string;
    action?: string;
    entityType?: string;
    page?: string;
  }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const actorFilter = params.actor?.trim() || undefined;
  const actionFilter =
    params.action && ACTIONS.includes(params.action as (typeof ACTIONS)[number])
      ? params.action
      : undefined;
  const entityFilter =
    params.entityType &&
    ENTITY_TYPES.includes(params.entityType as (typeof ENTITY_TYPES)[number])
      ? params.entityType
      : undefined;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const where: Prisma.AuditLogWhereInput = {};
  if (actorFilter) {
    where.actorEmail = { contains: actorFilter, mode: "insensitive" };
  }
  if (actionFilter) where.action = actionFilter;
  if (entityFilter) where.entityType = entityFilter;

  const [logs, total, actors] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["actorEmail"],
      select: { actorEmail: true },
      orderBy: { actorEmail: "asc" },
      take: 50,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Audit Log
        </h1>
        <p className="mt-1 text-slate-600">
          Every change made by admins (products, categories, industries, orders,
          settings, admin user changes). {total} entries.
        </p>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
      >
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600">Actor</span>
          <input
            type="text"
            name="actor"
            list="actor-list"
            defaultValue={actorFilter ?? ""}
            placeholder="email contains..."
            className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"
          />
          <datalist id="actor-list">
            {actors.map((a) => (
              <option key={a.actorEmail} value={a.actorEmail} />
            ))}
          </datalist>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600">Action</span>
          <select
            name="action"
            defaultValue={actionFilter ?? ""}
            className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"
          >
            <option value="">All</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600">Entity</span>
          <select
            name="entityType"
            defaultValue={entityFilter ?? ""}
            className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"
          >
            <option value="">All</option>
            {ENTITY_TYPES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-9 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Apply
          </button>
          <Link
            href="/admin/audit"
            className="h-9 rounded-md border border-slate-300 px-4 text-sm font-semibold leading-9 text-slate-600 transition hover:bg-slate-50"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">When</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Actor</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Action</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Entity</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No audit entries match these filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.actorEmail}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        ACTION_COLOR[log.action] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.entityType}</td>
                  <td className="px-4 py-3 text-slate-800">{log.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={{
                  pathname: "/admin/audit",
                  query: { ...params, page: page - 1 },
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={{
                  pathname: "/admin/audit",
                  query: { ...params, page: page + 1 },
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
