"use client";

import { Button } from "@/components/ui/button";

export function AuditExportButton({
  exportAction,
}: {
  exportAction: () => Promise<{
    buffer: Buffer;
    filename: string;
    contentType: string;
  }>;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        const result = await exportAction();
        const blob = new Blob([new Uint8Array(result.buffer)], {
          type: result.contentType,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      Export CSV
    </Button>
  );
}
