import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import type { Prisma, SystemLogCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

const CATEGORIES: SystemLogCategory[] = [
  "ERROR",
  "PAYMENT",
  "EMAIL",
  "SMS",
  "API",
  "LOGIN",
  "SECURITY",
];

const PAGE_SIZE = 50;

const LEVEL_COLOR: Record<string, string> = {
  info: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  warn: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  error: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; level?: string; page?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const categoryFilter =
    params.category &&
    CATEGORIES.includes(params.category as SystemLogCategory)
      ? (params.category as SystemLogCategory)
      : undefined;
  const levelFilter =
    params.level && ["info", "warn", "error"].includes(params.level)
      ? params.level
      : undefined;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const where: Prisma.SystemLogWhereInput = {};
  if (categoryFilter) where.category = categoryFilter;
  if (levelFilter) where.level = levelFilter;

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.systemLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          System Logs
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Payment, email, login, and security events. {total} entries.
        </p>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Category
          </span>
          <select
            name="category"
            defaultValue={categoryFilter ?? ""}
            className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Level
          </span>
          <select
            name="level"
            defaultValue={levelFilter ?? ""}
            className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">All</option>
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
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
            href="/admin/logs"
            className="h-9 rounded-md border border-slate-300 px-4 text-sm font-semibold leading-9 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">When</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Category</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Level</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Message</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No log entries match these filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                    {log.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        LEVEL_COLOR[log.level] ?? LEVEL_COLOR.info
                      }`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                    {log.message}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{log.ip ?? "—"}</td>
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
                href={{ pathname: "/admin/logs", query: { ...params, page: page - 1 } }}
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={{ pathname: "/admin/logs", query: { ...params, page: page + 1 } }}
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
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
