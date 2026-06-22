import { saveProductAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";

type ProductFormProps = {
  product?: {
    id: string;
    name: string;
    slug: string;
    brand?: string | null;
    description: string;
    shortDescription?: string | null;
    specifications?: string | null;
    images: string[];
    status: "ACTIVE" | "DRAFT";
    isNewArrival: boolean;
    isBestSeller: boolean;
    priceCadCents: number;
    priceUsdCents: number;
    saleCadCents?: number | null;
    saleUsdCents?: number | null;
    hasVariants: boolean;
    categories: Array<{ categoryId: string }>;
    industries: Array<{ industryId: string }>;
  };
};

export async function ProductForm({ product }: ProductFormProps) {
  const [categories, industries] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.industry.findMany({ orderBy: { name: "asc" } }),
  ]);

  const selectedCategoryIds = new Set(
    product?.categories.map((c) => c.categoryId) ?? [],
  );
  const selectedIndustryIds = new Set(
    product?.industries.map((i) => i.industryId) ?? [],
  );

  return (
    <form action={saveProductAction} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input id="name" name="name" defaultValue={product?.name ?? ""} required />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={product?.slug ?? ""} />
        </div>
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" defaultValue={product?.brand ?? ""} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={product?.status ?? "DRAFT"}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="shortDescription">Short Description</Label>
        <Input
          id="shortDescription"
          name="shortDescription"
          defaultValue={product?.shortDescription ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          required
        />
      </div>

      <div>
        <Label htmlFor="specifications">
          Specifications (one per line, format: Label: Value)
        </Label>
        <Textarea
          id="specifications"
          name="specifications"
          placeholder={"Model: HP782\nPlatform: Digital (DMR)\nChannels: 1024\nBand: VHF 136-174 MHz / UHF 400-527 MHz"}
          defaultValue={product?.specifications ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="images">Image URLs (one per line)</Label>
        <Textarea
          id="images"
          name="images"
          defaultValue={(product?.images ?? ["/placeholder-product.svg"]).join("\n")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="priceCadCents">Price CAD</Label>
          <Input
            id="priceCadCents"
            name="priceCadCents"
            type="number"
            step="0.01"
            min="0"
            defaultValue={((product?.priceCadCents ?? 0) / 100).toFixed(2)}
            required
          />
        </div>
        <div>
          <Label htmlFor="priceUsdCents">Price USD</Label>
          <Input
            id="priceUsdCents"
            name="priceUsdCents"
            type="number"
            step="0.01"
            min="0"
            defaultValue={((product?.priceUsdCents ?? 0) / 100).toFixed(2)}
            required
          />
        </div>
        <div>
          <Label htmlFor="saleCadCents">Sale CAD (optional)</Label>
          <Input
            id="saleCadCents"
            name="saleCadCents"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              product?.saleCadCents != null
                ? (product.saleCadCents / 100).toFixed(2)
                : ""
            }
          />
        </div>
        <div>
          <Label htmlFor="saleUsdCents">Sale USD (optional)</Label>
          <Input
            id="saleUsdCents"
            name="saleUsdCents"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              product?.saleUsdCents != null
                ? (product.saleUsdCents / 100).toFixed(2)
                : ""
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isNewArrival"
            defaultChecked={product?.isNewArrival}
          />
          New Arrival
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isBestSeller"
            defaultChecked={product?.isBestSeller}
          />
          Best Seller
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="hasVariants"
            defaultChecked={product?.hasVariants}
          />
          Has Variants
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label>Categories</Label>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={selectedCategoryIds.has(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label>Industries</Label>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
            {industries.map((industry) => (
              <label key={industry.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="industryIds"
                  value={industry.id}
                  defaultChecked={selectedIndustryIds.has(industry.id)}
                />
                {industry.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit">Save Product</Button>
    </form>
  );
}
