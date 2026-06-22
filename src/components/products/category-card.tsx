import Link from "next/link";
import { ArrowUpRight, Radio, Building2 } from "lucide-react";

type CategoryCardProps = {
  name: string;
  slug: string;
  description?: string | null;
};

export function CategoryCard({ name, slug, description }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
    >
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
        <Radio className="h-6 w-6" />
      </div>
      <h3 className="flex items-center justify-between text-lg font-bold text-slate-900 group-hover:text-red-600">
        {name}
        <ArrowUpRight className="h-5 w-5 text-slate-300 transition group-hover:text-red-600" />
      </h3>
      {description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{description}</p>
      )}
    </Link>
  );
}

export function IndustryCard({ name, slug, description }: CategoryCardProps) {
  return (
    <Link
      href={`/industries/${slug}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
    >
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-slate-900 text-white transition group-hover:bg-red-600">
        <Building2 className="h-6 w-6" />
      </div>
      <h3 className="flex items-center justify-between text-lg font-bold text-slate-900 group-hover:text-red-600">
        {name}
        <ArrowUpRight className="h-5 w-5 text-slate-300 transition group-hover:text-red-600" />
      </h3>
      {description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{description}</p>
      )}
    </Link>
  );
}
