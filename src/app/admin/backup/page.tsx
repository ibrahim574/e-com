import { requireSuperAdmin } from "@/lib/admin-guard";
import { DownloadBackupButton } from "@/components/admin/download-backup-button";

export const dynamic = "force-dynamic";

export default async function AdminBackupPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Backup &amp; Restore
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Download a complete snapshot of the store so it can be moved to another
          machine. The archive contains the full database, all uploaded files, and
          an environment snapshot (PayPal, SMTP, and auth keys) so everything keeps
          working after a restore.
        </p>
      </div>

      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Download full backup
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Produces a <code>.tar.gz</code> with the database dump, product/hero/
          featured/site uploads, invoice and expense files, and an{" "}
          <code>.env.backup</code> snapshot.
        </p>
        <div className="mt-4">
          <DownloadBackupButton />
        </div>
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          This file contains secrets (API keys, SMTP password, auth secret). Store
          it somewhere private and never commit it to source control.
        </p>
      </div>

      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Restore on a new machine
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li>Copy the downloaded archive and the project repo to the new server.</li>
          <li>
            Run the one-command restore script:
            <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
              ./scripts/restore.sh backup-YYYY-MM-DDThh-mm-ss.tar.gz
            </pre>
          </li>
          <li>
            It loads the env snapshot, starts Postgres, restores the database, drops
            the uploaded files into place, and brings the app up.
          </li>
        </ol>
      </div>
    </div>
  );
}
