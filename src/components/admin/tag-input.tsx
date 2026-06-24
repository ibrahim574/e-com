"use client";

import { useState, KeyboardEvent } from "react";
import { Input, Label } from "@/components/ui/input";

export function TagInput({
  name,
  label,
  defaultValue = "",
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [tags, setTags] = useState<string[]>(
    defaultValue
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  );
  const [input, setInput] = useState("");

  function addTag(value: string) {
    const v = value.trim();
    if (!v || tags.includes(v)) return;
    setTags((prev) => [...prev, v]);
    setInput("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <input type="hidden" name={name} value={tags.join(", ")} />
      <div className="mt-2 flex flex-wrap gap-2 rounded-md border border-slate-200 p-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
              className="text-blue-400 hover:text-blue-700"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={placeholder ?? "Type and press Enter"}
          className="min-w-[120px] flex-1 border-0 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
