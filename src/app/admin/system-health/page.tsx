import { requireSuperAdmin } from "@/lib/admin-guard";
import { getSystemHealth, type HealthStatus } from "@/lib/system-health";
import { RefreshButton } from "@/components/admin/refresh-button";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<HealthStatus, { dot: string; label: string; badge: string }> = {
  ok: {
    dot: "bg-emerald-500",
    label: "Operational",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  warn: {
    dot: "bg-amber-500",
    label: "Attention",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  down: {
    dot: "bg-red-500",
    label: "Down",
    badge: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  unknown: {
    dot: "bg-slate-400",
    label: "Unknown",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
};

export default async function AdminSystemHealthPage() {
  await requireSuperAdmin();
  const report = await getSystemHealth();
  const overall = STATUS_STYLES[report.overall];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            System Health
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Live status of core services. Generated{" "}
            {new Date(report.generatedAt).toLocaleString()}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${overall.badge}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${overall.dot}`} />
            {overall.label}
          </span>
          <RefreshButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {report.checks.map((check) => {
          const style = STATUS_STYLES[check.status];
          return (
            <div
              key={check.name}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  {check.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}
                >
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {check.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
