import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import {
  ComparisonAttributesManager,
  type AttributeRow,
} from "@/components/admin/comparison-attributes-manager";

export const dynamic = "force-dynamic";

export default async function AdminComparePage() {
  await requireAdmin();

  const attributes = await prisma.comparisonAttribute.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  const rows: AttributeRow[] = attributes.map((a) => ({
    id: a.id,
    label: a.label,
    source: a.source,
    key: a.key,
    position: a.position,
    enabled: a.enabled,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Compare Attributes
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Choose which product fields and specifications appear on the
          side-by-side comparison page.
        </p>
      </div>
      <ComparisonAttributesManager attributes={rows} />
    </div>
  );
}
