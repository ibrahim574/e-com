import os from "node:os";
import tls from "node:tls";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { getSiteUrl } from "@/lib/seo";

export type HealthStatus = "ok" | "warn" | "down" | "unknown";

export type HealthCheck = {
  name: string;
  status: HealthStatus;
  detail: string;
};

function bytesToMb(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

async function checkDatabase(): Promise<HealthCheck> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const ms = Date.now() - started;
    return {
      name: "PostgreSQL database",
      status: ms > 500 ? "warn" : "ok",
      detail: `Reachable — ${ms} ms query latency`,
    };
  } catch (err) {
    return {
      name: "PostgreSQL database",
      status: "down",
      detail: err instanceof Error ? err.message : "Unreachable",
    };
  }
}

async function checkSmtp(): Promise<HealthCheck> {
  try {
    const settings = await getSiteSettings();
    const configured = Boolean(settings.smtpHost || process.env.SMTP_HOST);
    return {
      name: "Email (SMTP)",
      status: configured ? "ok" : "warn",
      detail: configured
        ? `Configured (${settings.smtpHost || process.env.SMTP_HOST})`
        : "Not configured — transactional email is disabled",
    };
  } catch {
    return {
      name: "Email (SMTP)",
      status: "unknown",
      detail: "Could not read mail settings",
    };
  }
}

function checkPayPal(): HealthCheck {
  const configured = Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
  );
  const mode = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
  return {
    name: "Payment gateway (PayPal)",
    status: configured ? "ok" : "warn",
    detail: configured
      ? `Configured — ${mode} mode`
      : "Not configured — online card payment unavailable",
  };
}

function checkRedis(): HealthCheck {
  return {
    name: "Redis cache",
    status: "unknown",
    detail: "Not configured (optional)",
  };
}

async function checkSsl(): Promise<HealthCheck> {
  let host: string;
  try {
    host = new URL(getSiteUrl()).hostname;
  } catch {
    return { name: "SSL certificate", status: "unknown", detail: "No domain configured" };
  }

  if (host === "localhost" || host === "127.0.0.1") {
    return {
      name: "SSL certificate",
      status: "unknown",
      detail: "Local environment — no certificate to check",
    };
  }

  return new Promise<HealthCheck>((resolve) => {
    let settled = false;
    const finish = (check: HealthCheck) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        /* noop */
      }
      resolve(check);
    };

    const socket = tls.connect(
      { host, port: 443, servername: host, timeout: 5000 },
      () => {
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.valid_to) {
          finish({
            name: "SSL certificate",
            status: "warn",
            detail: "No certificate details available",
          });
          return;
        }
        const expiry = new Date(cert.valid_to);
        const days = Math.floor((expiry.getTime() - Date.now()) / 86_400_000);
        finish({
          name: "SSL certificate",
          status: days < 0 ? "down" : days < 14 ? "warn" : "ok",
          detail:
            days < 0
              ? `Expired ${Math.abs(days)} day(s) ago`
              : `Valid — expires in ${days} day(s) (${expiry.toDateString()})`,
        });
      },
    );

    socket.on("error", (err) => {
      finish({
        name: "SSL certificate",
        status: "down",
        detail: err instanceof Error ? err.message : "TLS connection failed",
      });
    });
    socket.on("timeout", () => {
      finish({
        name: "SSL certificate",
        status: "warn",
        detail: "TLS connection timed out",
      });
    });
  });
}

function checkMemory(): HealthCheck {
  const total = os.totalmem();
  const free = os.freemem();
  const usedPct = Math.round(((total - free) / total) * 100);
  const rss = bytesToMb(process.memoryUsage().rss);
  return {
    name: "Memory",
    status: usedPct > 90 ? "warn" : "ok",
    detail: `${usedPct}% host memory used — ${bytesToMb(total - free)}/${bytesToMb(
      total,
    )} MB; app RSS ${rss} MB`,
  };
}

async function checkDisk(): Promise<HealthCheck> {
  try {
    const { statfs } = await import("node:fs/promises");
    // statfs is available on Node 18.15+.
    const stats = await (statfs as unknown as (p: string) => Promise<{
      blocks: number;
      bsize: number;
      bavail: number;
    }>)(process.cwd());
    const total = stats.blocks * stats.bsize;
    const freeAvail = stats.bavail * stats.bsize;
    const usedPct = Math.round(((total - freeAvail) / total) * 100);
    return {
      name: "Disk",
      status: usedPct > 90 ? "warn" : "ok",
      detail: `${usedPct}% used — ${bytesToMb(freeAvail)} MB free of ${bytesToMb(
        total,
      )} MB`,
    };
  } catch {
    return {
      name: "Disk",
      status: "unknown",
      detail: "Disk stats unavailable on this platform",
    };
  }
}

function checkRuntime(): HealthCheck {
  return {
    name: "Runtime",
    status: "ok",
    detail: `Node ${process.version} · app uptime ${formatDuration(
      process.uptime(),
    )} · host uptime ${formatDuration(os.uptime())}`,
  };
}

export type SystemHealthReport = {
  generatedAt: string;
  overall: HealthStatus;
  checks: HealthCheck[];
};

function worst(checks: HealthCheck[]): HealthStatus {
  if (checks.some((c) => c.status === "down")) return "down";
  if (checks.some((c) => c.status === "warn")) return "warn";
  if (checks.every((c) => c.status === "ok")) return "ok";
  return "unknown";
}

export async function getSystemHealth(): Promise<SystemHealthReport> {
  const [database, smtp, ssl, disk] = await Promise.all([
    checkDatabase(),
    checkSmtp(),
    checkSsl(),
    checkDisk(),
  ]);

  const checks: HealthCheck[] = [
    database,
    smtp,
    checkPayPal(),
    checkRedis(),
    ssl,
    checkMemory(),
    disk,
    checkRuntime(),
  ];

  return {
    generatedAt: new Date().toISOString(),
    overall: worst(checks),
    checks,
  };
}
