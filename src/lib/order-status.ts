import type { OrderStatus } from "@prisma/client";

export const ORDER_STATUS_LIST: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

type StatusMeta = {
  label: string;
  /** Badge classes (bg + text). */
  badge: string;
  /** Solid dot color for indicators. */
  dot: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING: {
    label: "Waiting for Payment",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  PAID: {
    label: "Payment Completed",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  PROCESSING: {
    label: "Processing",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  SHIPPED: {
    label: "Shipped",
    badge: "bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-500",
  },
  DELIVERED: {
    label: "Delivered",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-600",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
  },
  REFUNDED: {
    label: "Refunded",
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
  },
};

/** Statuses that count as paid revenue. */
export const PAID_STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];
