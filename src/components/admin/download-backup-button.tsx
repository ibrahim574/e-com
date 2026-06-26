"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function DownloadBackupButton() {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    showToast("Preparing backup… this can take a moment.");
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const text = await res.text();
        showToast(text || "Backup failed.", "error");
        return;
      }

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const fileName = match?.[1] ?? "backup.tar.gz";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Backup downloaded.");
    } catch {
      showToast("Backup failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" onClick={handleDownload} disabled={busy}>
      {busy ? "Preparing…" : "Download backup"}
    </Button>
  );
}
