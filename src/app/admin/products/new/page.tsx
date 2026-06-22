import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/login");

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-blue-600">
          ← Back to products
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Add Product</h1>
      </div>
      <ProductForm />
    </div>
  );
}
