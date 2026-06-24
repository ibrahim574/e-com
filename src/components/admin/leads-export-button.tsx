"use client";

import { useState, useTransition } from "react";
import { exportLeadsCsvAction } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";

export function LeadsExportButton({ type }: { type?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportLeadsCsvAction(type);
      if (!result?.csv) {
        setError("Export failed.");
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={pending}>
        {pending ? "Exporting..." : "Export CSV"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
