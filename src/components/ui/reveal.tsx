"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "left" | "right" | "scale";

export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
}: {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before the reveal transition starts (useful for staggering). */
  delay?: number;
  variant?: RevealVariant;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const variantClass =
    variant === "left"
      ? "reveal-left"
      : variant === "right"
        ? "reveal-right"
        : variant === "scale"
          ? "reveal-scale"
          : "";

  return (
    <div
      ref={ref}
      className={cn("reveal w-full", variantClass, visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
