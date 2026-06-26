import { spawn } from "child_process";
import { mkdtemp, writeFile, rm, mkdir, stat } from "fs/promises";
import os from "os";
import path from "path";

/**
 * Environment keys included in the backup so a restored instance keeps working
 * (PayPal, SMTP fallback, auth secret used to decrypt stored SMTP password, etc.).
 * Only these are written; nothing else from process.env is leaked.
 */
const ENV_KEYS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_NAME",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_MODE",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",
] as const;

const UPLOAD_PATHS = [
  "public/products/uploads",
  "public/hero/uploads",
  "public/featured/uploads",
  "public/site/uploads",
  "uploads",
];

function run(
  command: string,
  args: string[],
  options: { env?: NodeJS.ProcessEnv } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

function buildEnvSnapshot(): string {
  const lines = [
    "# Environment snapshot captured by the in-app backup.",
    "# Restore by placing these values in your server .env before `docker compose up`.",
  ];
  for (const key of ENV_KEYS) {
    const value = process.env[key];
    if (value !== undefined && value !== "") {
      lines.push(`${key}=${value}`);
    }
  }
  return lines.join("\n") + "\n";
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export type BackupArtifact = {
  filePath: string;
  fileName: string;
  cleanup: () => Promise<void>;
};

/**
 * Creates a .tar.gz containing a SQL dump of the database, an env snapshot, and
 * all upload directories. Returns the path to the archive plus a cleanup fn.
 * Requires `pg_dump` and `tar` to be available on the host (installed in the
 * production Docker image).
 */
export async function createBackupArchive(): Promise<BackupArtifact> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  const cwd = process.cwd();
  const work = await mkdtemp(path.join(os.tmpdir(), "backup-"));

  const dumpPath = path.join(work, "db.sql");
  const envPath = path.join(work, ".env.backup");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `backup-${stamp}.tar.gz`;
  const archivePath = path.join(work, fileName);

  // 1. Database dump (clean + if-exists so restore is idempotent).
  await run("pg_dump", [
    "--no-owner",
    "--no-privileges",
    "--clean",
    "--if-exists",
    "-f",
    dumpPath,
    databaseUrl,
  ]);

  // 2. Env snapshot.
  await writeFile(envPath, buildEnvSnapshot(), { mode: 0o600 });

  // 3. Ensure upload dirs exist so tar does not fail, and collect existing ones.
  const existingUploads: string[] = [];
  for (const rel of UPLOAD_PATHS) {
    const abs = path.join(cwd, rel);
    if (!(await pathExists(abs))) {
      await mkdir(abs, { recursive: true }).catch(() => {});
    }
    if (await pathExists(abs)) {
      existingUploads.push(rel);
    }
  }

  // 4. Build archive: db.sql + .env.backup from work dir, uploads from app cwd.
  const tarArgs = [
    "-czf",
    archivePath,
    "-C",
    work,
    "db.sql",
    ".env.backup",
    "-C",
    cwd,
    ...existingUploads,
  ];
  await run("tar", tarArgs);

  return {
    filePath: archivePath,
    fileName,
    cleanup: async () => {
      await rm(work, { recursive: true, force: true });
    },
  };
}
