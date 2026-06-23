"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COUNTRY_DEFAULT = "CA";

export async function updateCustomerProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to update your profile." };
  }

  const name = String(formData.get("name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim() || null;
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim() || null;
  const addressCity = String(formData.get("addressCity") ?? "").trim() || null;
  const addressState = String(formData.get("addressState") ?? "").trim() || null;
  const addressPostal = String(formData.get("addressPostal") ?? "").trim() || null;
  const addressCountry =
    String(formData.get("addressCountry") ?? "").trim().toUpperCase() ||
    COUNTRY_DEFAULT;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone,
      addressLine1,
      addressLine2,
      addressCity,
      addressState,
      addressPostal,
      addressCountry,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: true };
}
