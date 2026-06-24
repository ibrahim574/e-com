import { requireAdmin } from "@/lib/admin-guard";
import { ReportsClient } from "@/components/admin/reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Financial Reports</h1>
        <p className="text-slate-600">Generate and download reports in PDF, Excel, or CSV.</p>
      </div>
      <ReportsClient />
    </div>
  );
}
