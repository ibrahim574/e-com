import { describe, expect, it } from "vitest";

function dedupePreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

describe("related product id ordering", () => {
  it("deduplicates while preserving manual priority order", () => {
    const merged = dedupePreserveOrder(["b", "a", "b", "c", "a"]);
    expect(merged).toEqual(["b", "a", "c"]);
  });
});
