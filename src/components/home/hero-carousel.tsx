"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string;
  linkUrl: string | null;
};

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const slide = slides[index];

  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }

  function next() {
    setIndex((i) => (i + 1) % slides.length);
  }

  const content = (
    <div className="relative aspect-[21/9] w-full overflow-hidden bg-slate-900 sm:aspect-[21/8] lg:aspect-[21/7]">
      {slides.map((s, i) => (
        <Image
          key={s.id}
          src={s.image}
          alt={s.title ?? "Homepage slide"}
          fill
          priority={i === 0}
          unoptimized={s.image.startsWith("/hero/uploads/")}
          className={`object-cover transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          sizes="100vw"
        />
      ))}
      {(slide.title || slide.subtitle) && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent">
          <div className="container-page flex h-full flex-col justify-center">
            {slide.title && (
              <h2 className="max-w-xl text-2xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                {slide.title}
              </h2>
            )}
            {slide.subtitle && (
              <p className="mt-3 max-w-lg text-sm text-white/90 sm:text-lg">{slide.subtitle}</p>
            )}
          </div>
        </div>
      )}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              prev();
            }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              next();
            }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIndex(i);
                }}
                className={`h-2 w-2 rounded-full transition ${
                  i === index ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (slide.linkUrl) {
    return (
      <section className="border-b border-slate-200 dark:border-slate-800">
        <Link href={slide.linkUrl} className="block">
          {content}
        </Link>
      </section>
    );
  }

  return (
    <section className="border-b border-slate-200 dark:border-slate-800">{content}</section>
  );
}
