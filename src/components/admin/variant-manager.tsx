import {
  saveProductOptionAction,
  saveVariantAction,
  generateVariantMatrixAction,
  deleteVariantAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type VariantManagerProps = {
  product: {
    id: string;
    options: Array<{
      id: string;
      name: string;
      values: Array<{ id: string; value: string }>;
    }>;
    variants: Array<{
      id: string;
      sku: string;
      stock: number;
      priceCadCents?: number | null;
      priceUsdCents?: number | null;
      saleCadCents?: number | null;
      saleUsdCents?: number | null;
      image?: string | null;
      options: Array<{
        optionValue: { value: string; option: { name: string } };
      }>;
    }>;
  };
};

export function VariantManager({ product }: VariantManagerProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Product Options</h2>
        <form action={saveProductOptionAction} className="mt-4 grid gap-4 md:grid-cols-3">
          <input type="hidden" name="productId" value={product.id} />
          <div>
            <Label htmlFor="optionName">Option Name</Label>
            <Input id="optionName" name="name" placeholder="e.g. Display" required />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="optionValues">Values (comma separated)</Label>
            <Input id="optionValues" name="values" placeholder="Non-Display, With Display" required />
          </div>
          <Button type="submit" className="md:col-span-3 md:w-fit">
            Add Option
          </Button>
        </form>

        {product.options.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {product.options.map((option) => (
              <li key={option.id} className="rounded-md bg-slate-50 p-3">
                <strong>{option.name}:</strong> {option.values.map((v) => v.value).join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Variants</h2>
        {product.options.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Add at least one option before creating variants.
          </p>
        ) : (
          <>
            <form action={generateVariantMatrixAction} className="mt-4">
              <input type="hidden" name="productId" value={product.id} />
              <Button type="submit" variant="outline">
                Generate All Combinations
              </Button>
            </form>
            <form action={saveVariantAction} className="mt-6 space-y-4">
              <input type="hidden" name="productId" value={product.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" name="sku" required />
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" name="stock" type="number" min="0" defaultValue="0" />
                </div>
                <div>
                  <Label htmlFor="variantPriceCad">Price CAD override</Label>
                  <Input id="variantPriceCad" name="priceCadCents" type="number" step="0.01" />
                </div>
                <div>
                  <Label htmlFor="variantPriceUsd">Price USD override</Label>
                  <Input id="variantPriceUsd" name="priceUsdCents" type="number" step="0.01" />
                </div>
                <div>
                  <Label htmlFor="saleCadCents">Sale CAD</Label>
                  <Input id="saleCadCents" name="saleCadCents" type="number" step="0.01" />
                </div>
                <div>
                  <Label htmlFor="saleUsdCents">Sale USD</Label>
                  <Input id="saleUsdCents" name="saleUsdCents" type="number" step="0.01" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input id="image" name="image" placeholder="/uploads/..." />
                </div>
              </div>
              <div>
                <Label>Option Values</Label>
                <div className="mt-2 space-y-2">
                  {product.options.map((option) => (
                    <div key={option.id}>
                      <Label htmlFor={`option-${option.id}`}>{option.name}</Label>
                      <select
                        id={`option-${option.id}`}
                        name="optionValueIds"
                        className="mt-1 flex h-11 w-full rounded-md border border-slate-300 px-3"
                        required
                      >
                        <option value="">Select {option.name}</option>
                        {option.values.map((value) => (
                          <option key={value.id} value={value.id}>
                            {value.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit">Add Variant</Button>
            </form>
          </>
        )}

        {product.variants.length > 0 && (
          <div className="mt-6 space-y-4">
            {product.variants.map((variant) => (
              <div key={variant.id} className="rounded-lg border border-slate-200 p-4">
                <p className="mb-3 text-sm font-medium text-slate-700">
                  {variant.options
                    .map((o) => `${o.optionValue.option.name}: ${o.optionValue.value}`)
                    .join(" / ")}
                </p>
                <form action={saveVariantAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="variantId" value={variant.id} />
                  <div>
                    <Label>SKU</Label>
                    <Input name="sku" defaultValue={variant.sku} required />
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <Input name="stock" type="number" min="0" defaultValue={variant.stock} />
                  </div>
                  <div>
                    <Label>Sale CAD</Label>
                    <Input
                      name="saleCadCents"
                      type="number"
                      step="0.01"
                      defaultValue={
                        variant.saleCadCents != null ? (variant.saleCadCents / 100).toFixed(2) : ""
                      }
                    />
                  </div>
                  <div>
                    <Label>Sale USD</Label>
                    <Input
                      name="saleUsdCents"
                      type="number"
                      step="0.01"
                      defaultValue={
                        variant.saleUsdCents != null ? (variant.saleUsdCents / 100).toFixed(2) : ""
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Image URL</Label>
                    <Input name="image" defaultValue={variant.image ?? ""} />
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-2">
                    <Button type="submit" size="sm">
                      Save
                    </Button>
                  </div>
                </form>
                <form action={deleteVariantAction} className="mt-2">
                  <input type="hidden" name="variantId" value={variant.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <Button type="submit" size="sm" variant="ghost" className="text-red-600">
                    Delete variant
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
