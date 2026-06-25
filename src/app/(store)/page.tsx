import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Headphones,
  Star,
  Globe,
  Zap,
  BadgeCheck,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { CategoryCard, IndustryCard } from "@/components/products/category-card";
import { FeaturedTabs } from "@/components/products/featured-tabs";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { HeroFeaturedProductPanel } from "@/components/home/hero-featured-product-panel";
import { FeaturedItemsSection } from "@/components/home/featured-items-section";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/currency-server";
import { cacheGet, cacheSet } from "@/lib/cache";

async function getHeroSlides() {
  const cached = cacheGet<Awaited<ReturnType<typeof fetchHeroSlides>>>("hero-slides");
  if (cached) return cached;
  const slides = await fetchHeroSlides();
  cacheSet("hero-slides", slides);
  return slides;
}

async function fetchHeroSlides() {
  return prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, title: true, subtitle: true, image: true, linkUrl: true },
  });
}

async function getFeaturedItems() {
  const cached = cacheGet<Awaited<ReturnType<typeof fetchFeatured>>>("featured-items");
  if (cached) return cached;
  const items = await fetchFeatured();
  cacheSet("featured-items", items);
  return items;
}

async function fetchFeatured() {
  return prisma.featuredItem.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, title: true, image: true, altText: true, linkUrl: true },
  });
}

async function getHeroFeaturedProducts() {
  const cached =
    cacheGet<Awaited<ReturnType<typeof fetchHeroFeaturedProducts>>>("hero-featured-products");
  if (cached) return cached;
  const products = await fetchHeroFeaturedProducts();
  cacheSet("hero-featured-products", products);
  return products;
}

async function fetchHeroFeaturedProducts() {
  const entries = await prisma.heroFeaturedProduct.findMany({
    where: { product: { status: "ACTIVE" } },
    orderBy: { position: "asc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          shortDescription: true,
          images: true,
        },
      },
    },
  });
  return entries.map((e) => e.product);
}

export default async function HomePage() {
  const currency = await getCurrency();

  const [newArrivals, bestSellers, categories, industries, reviews, heroSlides, featuredItems, heroFeaturedProducts] =
    await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE", isNewArrival: true },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", isBestSeller: true },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" }, take: 6 }),
      prisma.industry.findMany({ orderBy: { name: "asc" }, take: 6 }),
      prisma.review.findMany({
        where: { featured: true },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      getHeroSlides(),
      getFeaturedItems(),
      getHeroFeaturedProducts(),
    ]);

  const valueProps = [
    { icon: Truck, title: "Fast Free Shipping", desc: "On all qualifying orders across the US & Canada." },
    { icon: ShieldCheck, title: "1-Year Warranty", desc: "Every radio is backed by our satisfaction guarantee." },
    { icon: Headphones, title: "Expert Programming", desc: "We configure channels and roles to match your fleet." },
    { icon: Globe, title: "Nationwide Range", desc: "PoC over LTE + Wi-Fi keeps teams connected anywhere." },
  ];

  const stats = [
    { value: "25+", label: "Years of experience" },
    { value: "50k+", label: "Radios deployed" },
    { value: "4.9/5", label: "Customer rating" },
  ];

  return (
    <>
      {heroSlides.length > 0 ? (
        <HeroCarousel slides={heroSlides} />
      ) : null}

      {/* HERO — always show copy + featured product panel */}
      <section className="hero-light relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400">
              <Zap className="h-3.5 w-3.5" /> Over 25 Years in Two-Way Radio
            </span>
            <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Two-Way Radios Built to <span className="text-blue-600">Keep You Connected</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Business, commercial, and nationwide PoC radios — with expert
              programming, fast shipping, and industry-ready kits for every team.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/search">
                  Shop All Radios <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  <PhoneCall className="h-4 w-4" /> Talk to an Expert
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <HeroFeaturedProductPanel products={heroFeaturedProducts} />
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container-page grid gap-px overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4 lg:py-0">
          {valueProps.map((vp) => (
            <div
              key={vp.title}
              className="flex items-start gap-4 bg-white px-2 py-8 lg:px-6 dark:bg-slate-900"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950">
                <vp.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{vp.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {vp.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FeaturedItemsSection items={featuredItems} />

      {/* FEATURED PRODUCTS */}
      <section className="container-page py-16 lg:py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Handpicked for you</p>
            <h2 className="section-title mt-2">Featured Products</h2>
          </div>
          <Link
            href="/search"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
          >
            View all products
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-8">
          <FeaturedTabs
            bestSellers={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {bestSellers.map((product) => (
                  <ProductCard key={product.id} product={product} currency={currency} />
                ))}
              </div>
            }
            newArrivals={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} currency={currency} />
                ))}
              </div>
            }
          />
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="bg-slate-50 py-16 lg:py-20 dark:bg-slate-950">
        <div className="container-page">
          <div className="text-center">
            <p className="eyebrow">Find the right gear</p>
            <h2 className="section-title mt-2">Shop by Category</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              From compact business radios to professional MOTOTRBO portfolios —
              there&apos;s a solution for every team.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="container-page py-16 lg:py-20">
        <div className="text-center">
          <p className="eyebrow">Tailored solutions</p>
          <h2 className="section-title mt-2">Built for Your Industry</h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <IndustryCard key={industry.id} {...industry} />
          ))}
        </div>
      </section>

      {/* PROMO CTA */}
      <section className="container-page pb-16 lg:pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-8 py-14 shadow-sm lg:px-16 dark:border-slate-700 dark:bg-slate-900">
          <div className="dot-grid absolute inset-0 opacity-70" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-50 blur-2xl dark:bg-blue-950" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow">No-cost consultation</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                Need help choosing the right radio?
              </h2>
              <p className="mt-4 max-w-lg text-slate-600 dark:text-slate-300">
                Our US &amp; Canada based team will match the gear and programming
                to your workflows and existing fleets — at no extra cost.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button size="lg" asChild>
                <Link href="/contact">
                  <PhoneCall className="h-4 w-4" /> Get Expert Advice
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/search">Browse Catalog</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-slate-50 py-16 lg:py-20 dark:bg-slate-950">
        <div className="container-page">
          <div className="text-center">
            <div className="mb-3 flex items-center justify-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="eyebrow">Trusted by thousands</p>
            <h2 className="section-title mt-2">What Our Customers Say</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {reviews.map((review) => (
              <figure
                key={review.id}
                className="card-surface flex flex-col p-6"
              >
                <div className="mb-3 flex gap-1 text-amber-400">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="flex-1 text-slate-700 dark:text-slate-300">
                  &ldquo;{review.content}&rdquo;
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <BadgeCheck className="h-4 w-4 text-green-600" />
                  {review.author}
                  <span className="font-normal text-slate-400">· Verified Buyer</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE CTA */}
      <section className="container-page py-16 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-14 text-center text-white shadow-xl lg:px-16">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Stay Connected</h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            Need a quote for radios, accessories, or a custom deployment? Our team
            is ready to help.
          </p>
          <div className="mx-auto mt-7">
            <a
              href="/stay-connected"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-sm font-bold text-blue-700 hover:bg-blue-50"
            >
              Request a Quote
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
