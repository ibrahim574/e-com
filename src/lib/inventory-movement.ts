import type { Prisma } from "@prisma/client";
import type { InventoryChangeType } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export async function logInventoryMovement(
  tx: Tx,
  input: {
    productId: string;
    variantId?: string | null;
    productName: string;
    sku?: string | null;
    changeType: InventoryChangeType;
    qtyBefore: number;
    qtyAfter: number;
    changedById?: string | null;
  },
) {
  await tx.inventoryMovement.create({
    data: {
      productId: input.productId,
      variantId: input.variantId ?? null,
      productName: input.productName,
      sku: input.sku ?? null,
      changeType: input.changeType,
      qtyBefore: input.qtyBefore,
      qtyAfter: input.qtyAfter,
      delta: input.qtyAfter - input.qtyBefore,
      changedById: input.changedById ?? null,
    },
  });
}
