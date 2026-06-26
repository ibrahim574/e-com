import { saveProductAction } from "@/app/actions/admin";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import { TagInput } from "@/components/admin/tag-input";
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
    stock: number;
    purchaseCostCents: number | null;
    lowStockThreshold: number;
    seriesId?: string | null;
    frequencyOptions?: string[];
    allowCustomFrequency?: boolean;
    customTxRequired?: boolean;
    customRxRequired?: boolean;
    allowPreorder?: boolean;
    preorderReleaseDate?: Date | string | null;
    allowBackorder?: boolean;
    categories: Array<{ categoryId: string }>;
    industries: Array<{ industryId: string }>;
    signalTypes?: Array<{ signalTypeId: string }>;
    frequencyBands?: Array<{ frequencyBandId: string }>;
    relatedFrom?: Array<{ relatedProductId: string }>;
    compatibleFrom?: Array<{ compatibleProductId: string }>;
    shippingEnabled?: boolean;
    lengthCm?: number | null;
    widthCm?: number | null;
    heightCm?: number | null;
    weightGrams?: number | null;
    shippingClassId?: string | null;
    youtubeUrl?: string | null;
  };
};

export async function ProductForm({ product }: ProductFormProps) {
  const [categories, industries, seriesList, signalTypes, frequencyBands, allProducts, shippingClasses] =
    await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.industry.findMany({ orderBy: { name: "asc" } }),
      prisma.series.findMany({ orderBy: { name: "asc" } }),
      prisma.signalType.findMany({ orderBy: { name: "asc" } }),
      prisma.frequencyBand.findMany({ orderBy: { name: "asc" } }),
      prisma.product.findMany({
        where: product ? { id: { not: product.id } } : undefined,
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.shippingClass.findMany({ orderBy: { name: "asc" } }),
    ]);

  const selectedCategoryIds = new Set(
    product?.categories.map((c) => c.categoryId) ?? [],
  );
  const selectedIndustryIds = new Set(
    product?.industries.map((i) => i.industryId) ?? [],
  );
  const selectedSignalTypeIds = new Set(
    product?.signalTypes?.map((s) => s.signalTypeId) ?? [],
  );
  const selectedBandIds = new Set(
    product?.frequencyBands?.map((b) => b.frequencyBandId) ?? [],
  );
  const selectedRelatedIds = new Set(
    product?.relatedFrom?.map((r) => r.relatedProductId) ?? [],
  );
  const selectedCompatibleIds = new Set(
    product?.compatibleFrom?.map((c) => c.compatibleProductId) ?? [],
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

      <ProductImageManager defaultImages={product?.images ?? []} />

      <div>
        <Label htmlFor="youtubeUrl">YouTube Video URL</Label>
        <Input
          id="youtubeUrl"
          name="youtubeUrl"
          placeholder="https://www.youtube.com/watch?v=..."
          defaultValue={product?.youtubeUrl ?? ""}
        />
        <p className="mt-1 text-xs text-slate-500">
          Optional product demo video visitors can play on the product page.
        </p>
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
        <div>
          <Label htmlFor="stock">Stock quantity</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock ?? 0}
          />
          <p className="mt-1 text-xs text-slate-500">
            For simple products without variants. If &quot;Has Variants&quot; is checked, set stock on each variant below.
          </p>
        </div>
        <div>
          <Label htmlFor="purchaseCostCents">Purchase cost (CAD $)</Label>
          <Input
            id="purchaseCostCents"
            name="purchaseCostCents"
            type="number"
            min="0"
            step="0.01"
            defaultValue={
              product?.purchaseCostCents != null
                ? (product.purchaseCostCents / 100).toFixed(2)
                : ""
            }
          />
        </div>
        <div>
          <Label htmlFor="lowStockThreshold">Low stock threshold</Label>
          <Input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.lowStockThreshold ?? 5}
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

      <div className="rounded-lg border border-slate-200 p-4">
        <h2 className="text-base font-bold text-slate-900">
          Availability (pre-order / backorder)
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Allow customers to buy even when stock is zero. Leave both off to show
          a &quot;Request this product&quot; form on out-of-stock items.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="allowPreorder"
              defaultChecked={product?.allowPreorder}
            />
            Allow pre-orders
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="allowBackorder"
              defaultChecked={product?.allowBackorder}
            />
            Allow backorders
          </label>
          <div>
            <Label htmlFor="preorderReleaseDate">Pre-order release date</Label>
            <Input
              id="preorderReleaseDate"
              name="preorderReleaseDate"
              type="date"
              defaultValue={
                product?.preorderReleaseDate
                  ? new Date(product.preorderReleaseDate)
                      .toISOString()
                      .slice(0, 10)
                  : ""
              }
            />
          </div>
        </div>
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="seriesId">Product Series</Label>
          <Select id="seriesId" name="seriesId" defaultValue={product?.seriesId ?? ""}>
            <option value="">None</option>
            {seriesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <TagInput
        name="frequencyOptions"
        label="Frequency Options"
        defaultValue={(product?.frequencyOptions ?? []).join(", ")}
        placeholder="e.g. Default Frequency, UHF 400-470"
      />

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="allowCustomFrequency"
            defaultChecked={product?.allowCustomFrequency}
          />
          Allow custom frequency entry
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="customTxRequired"
            defaultChecked={product?.customTxRequired}
          />
          TX frequency required
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="customRxRequired"
            defaultChecked={product?.customRxRequired}
          />
          RX frequency required
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label>Signal Types</Label>
          <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
            {signalTypes.map((st) => (
              <label key={st.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="signalTypeIds"
                  value={st.id}
                  defaultChecked={selectedSignalTypeIds.has(st.id)}
                />
                {st.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label>Frequency Bands</Label>
          <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
            {frequencyBands.map((fb) => (
              <label key={fb.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="frequencyBandIds"
                  value={fb.id}
                  defaultChecked={selectedBandIds.has(fb.id)}
                />
                {fb.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label>Manual Related Products</Label>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
            {allProducts.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="relatedProductIds"
                  value={p.id}
                  defaultChecked={selectedRelatedIds.has(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label>Compatible Accessories</Label>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
            {allProducts.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="compatibleProductIds"
                  value={p.id}
                  defaultChecked={selectedCompatibleIds.has(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h2 className="text-base font-bold text-slate-900">Shipping</h2>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="shippingEnabled"
            defaultChecked={product?.shippingEnabled ?? true}
          />
          Include in shipping weight calculation
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="weightGrams">Weight (grams)</Label>
            <Input id="weightGrams" name="weightGrams" type="number" min="0" defaultValue={product?.weightGrams ?? ""} />
          </div>
          <div>
            <Label htmlFor="lengthCm">Length (cm)</Label>
            <Input id="lengthCm" name="lengthCm" type="number" min="0" step="0.1" defaultValue={product?.lengthCm ?? ""} />
          </div>
          <div>
            <Label htmlFor="widthCm">Width (cm)</Label>
            <Input id="widthCm" name="widthCm" type="number" min="0" step="0.1" defaultValue={product?.widthCm ?? ""} />
          </div>
          <div>
            <Label htmlFor="heightCm">Height (cm)</Label>
            <Input id="heightCm" name="heightCm" type="number" min="0" step="0.1" defaultValue={product?.heightCm ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="shippingClassId">Shipping class</Label>
            <select
              id="shippingClassId"
              name="shippingClassId"
              defaultValue={product?.shippingClassId ?? ""}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Standard</option>
              {shippingClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Button type="submit">Save Product</Button>
    </form>
  );
}
