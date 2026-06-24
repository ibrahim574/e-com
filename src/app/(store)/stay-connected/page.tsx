import Link from "next/link";
import { QuoteForm } from "@/components/forms/quote-form";

export default async function StayConnectedPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product = "" } = await searchParams;

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Need a Quote? Let&apos;s Connect.
        </h1>
        <p className="mt-3 text-slate-600">
          Tell us what you need and our team will get back to you with pricing and
          availability. Fill out the form below and we&apos;ll be in touch shortly.
        </p>
        <div className="mt-8">
          <QuoteForm defaultProduct={product} />
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Prefer to call?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">
            View our contact info
          </Link>
        </p>
      </div>
    </div>
  );
}
