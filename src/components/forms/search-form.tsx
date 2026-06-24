"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = query.trim();
      const current = initialQuery.trim();
      if (q === current) return;
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    }, 300);
    return () => clearTimeout(timer);
  }, [query, initialQuery, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search radios, accessories..."
      />
      <Button type="submit">Search</Button>
    </form>
  );
}
