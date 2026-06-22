import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Store Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const categories = [
    {
      name: "Business Radios",
      slug: "business-radios",
      description: "Compact, simple, and reliable radios for customer-facing teams.",
    },
    {
      name: "Commercial Radios",
      slug: "commercial-radios",
      description: "Durable radios with extended range for demanding environments.",
    },
    {
      name: "Professional Radios",
      slug: "professional-radios",
      description: "Professional-grade MOTOTRBO radios with advanced features.",
    },
    {
      name: "Nationwide Radios",
      slug: "nationwide-radios",
      description: "PoC LTE + Wi-Fi radios with unlimited nationwide range.",
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Earpieces, microphones, holsters, and more.",
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const industries = [
    { name: "Schools", slug: "schools", description: "Campus-wide communication for safety and logistics." },
    { name: "Security", slug: "security", description: "Instant PTT for patrols and incident response." },
    { name: "Retail Stores", slug: "retail", description: "Compact radios for floor coordination." },
    { name: "Construction", slug: "construction", description: "Rugged radios built for active job sites." },
    { name: "Hospitality", slug: "hospitality", description: "Discreet radios for hotels and restaurants." },
    { name: "Healthcare", slug: "healthcare", description: "Reliable communication for care teams." },
  ];

  for (const industry of industries) {
    await prisma.industry.upsert({
      where: { slug: industry.slug },
      update: industry,
      create: industry,
    });
  }

  const categoryMap = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );
  const industryMap = Object.fromEntries(
    (await prisma.industry.findMany()).map((i) => [i.slug, i.id]),
  );

  const FREQUENCY_BAND = {
    name: "Frequency Band",
    values: ["VHF (136-174 MHz)", "UHF (400-527 MHz)"],
  };
  const PROGRAMMING = {
    name: "Programming",
    values: ["Default Frequency", "Custom Frequency"],
  };

  type SeedOption = { name: string; values: string[] };
  type SeedVariant = {
    sku: string;
    stock: number;
    options: string[];
    priceCadCents?: number;
    priceUsdCents?: number;
  };
  type SeedReview = { author: string; content: string; rating: number };
  type SeedProduct = {
    name: string;
    slug: string;
    brand: string;
    description: string;
    shortDescription: string;
    specifications: string;
    images: string[];
    status: "ACTIVE" | "DRAFT";
    isNewArrival: boolean;
    isBestSeller: boolean;
    priceCadCents: number;
    priceUsdCents: number;
    saleCadCents?: number | null;
    saleUsdCents?: number | null;
    hasVariants: boolean;
    categories: string[];
    industries: string[];
    options?: SeedOption[];
    variants?: SeedVariant[];
    reviews?: SeedReview[];
  };

  const products: SeedProduct[] = [
    {
      name: "Hytera HP782 Digital Two-Way Radio",
      slug: "hytera-hp782-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera HP782 is a flagship DMR Tier II/III professional radio engineered for maximum audio clarity, resilience, and expandability. With intelligent noise cancellation, Bluetooth, GPS, and a IP68 rugged body, it keeps mission-critical teams connected on the loudest, most demanding sites.\n\nWho it's for\nTeams in security, manufacturing, construction, and large campuses that need crystal-clear audio and dependable coverage shift after shift.\n\nKey features\n• Intelligent active noise cancellation for clear transmissions in loud environments\n• Built-in Bluetooth 5.1, GPS, and BeiDou positioning\n• IP68 dust- and water-proof rugged housing\n• Up to 1024 channels and large color display\n• Long-life Li-ion battery for full-shift operation\n\nChoose your frequency band (VHF or UHF) and programming option (default factory frequencies or custom frequencies programmed to your fleet) using the selectors above.",
      shortDescription:
        "Flagship DMR professional radio with noise cancellation, Bluetooth, GPS, and IP68 rugged build.",
      specifications: [
        "Model: Hytera HP782",
        "Platform: Digital (DMR Tier II / III)",
        "Channels: 1024",
        "Frequency Band: VHF 136-174 MHz / UHF 400-527 MHz",
        "Display: Color LCD",
        "Audio Output: 2W loud, clear audio",
        "Noise Cancellation: Intelligent active noise cancellation",
        "Connectivity: Bluetooth 5.1, GPS, BeiDou",
        "Ingress Protection: IP68 (dust & water proof)",
        "Battery: 2400 mAh Li-ion (full-shift)",
        "License Required: Yes — FCC / band dependent",
      ].join("\n"),
      images: ["/placeholder-product.svg"],
      status: "ACTIVE" as const,
      isNewArrival: true,
      isBestSeller: true,
      priceCadCents: 89900,
      priceUsdCents: 67900,
      saleCadCents: null,
      saleUsdCents: null,
      hasVariants: true,
      categories: ["professional-radios"],
      industries: ["security", "construction"],
      options: [FREQUENCY_BAND, PROGRAMMING],
      variants: [
        { sku: "HP782-VHF-DEF", stock: 24, options: ["VHF (136-174 MHz)", "Default Frequency"] },
        { sku: "HP782-VHF-CUST", stock: 16, options: ["VHF (136-174 MHz)", "Custom Frequency"], priceCadCents: 94900, priceUsdCents: 71900 },
        { sku: "HP782-UHF-DEF", stock: 30, options: ["UHF (400-527 MHz)", "Default Frequency"] },
        { sku: "HP782-UHF-CUST", stock: 21, options: ["UHF (400-527 MHz)", "Custom Frequency"], priceCadCents: 94900, priceUsdCents: 71900 },
      ],
      reviews: [
        { author: "Daniel R.", content: "Audio is incredibly clear even on our noisy plant floor. Custom programming arrived ready to go.", rating: 5 },
        { author: "Site Safety Lead", content: "Rugged, reliable, and the battery easily lasts a full 12-hour shift. Highly recommend the UHF version.", rating: 5 },
        { author: "Megan T.", content: "Great upgrade from our old analog fleet. The team programmed everything to match our channels perfectly.", rating: 4 },
      ],
    },
    {
      name: "Hytera HP602 Digital Portable Radio",
      slug: "hytera-hp602-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera HP602 delivers professional DMR performance in a compact, durable body. With clear audio, Bluetooth, and long battery life, it's an ideal everyday radio for commercial teams.\n\nSelect your frequency band (VHF or UHF) above to match your licensed spectrum.",
      shortDescription: "Compact professional DMR radio with Bluetooth and long battery life.",
      specifications: [
        "Model: Hytera HP602",
        "Platform: Digital (DMR Tier II)",
        "Channels: 1024",
        "Frequency Band: VHF 136-174 MHz / UHF 400-527 MHz",
        "Display: Monochrome LCD",
        "Connectivity: Bluetooth",
        "Ingress Protection: IP67",
        "Battery: 1950 mAh Li-ion",
        "License Required: Yes — FCC / band dependent",
      ].join("\n"),
      images: ["/placeholder-product.svg"],
      status: "ACTIVE" as const,
      isNewArrival: true,
      isBestSeller: true,
      priceCadCents: 64900,
      priceUsdCents: 49900,
      hasVariants: true,
      categories: ["commercial-radios"],
      industries: ["retail", "hospitality"],
      options: [FREQUENCY_BAND],
      variants: [
        { sku: "HP602-VHF", stock: 28, options: ["VHF (136-174 MHz)"] },
        { sku: "HP602-UHF", stock: 35, options: ["UHF (400-527 MHz)"] },
      ],
    },
    {
      name: "Hytera PNC560 Nationwide PoC Radio",
      slug: "hytera-pnc560-poc-radio",
      brand: "Hytera",
      description:
        "The Hytera PNC560 is a 4G LTE + Wi-Fi push-to-talk over cellular (PoC) radio that delivers instant communication with unlimited nationwide range and zero range anxiety. A large touchscreen, Android platform, and centralized management make it perfect for distributed teams.",
      shortDescription: "4G LTE + Wi-Fi PoC radio with unlimited nationwide range.",
      specifications: [
        "Model: Hytera PNC560",
        "Platform: PoC (Push-to-talk over Cellular)",
        "Network: 4G LTE / 3G / 2G / Wi-Fi",
        "Operating System: Android",
        "Display: 2.4\" color touchscreen",
        "Positioning: GPS / GLONASS / BeiDou",
        "Coverage: Nationwide (carrier dependent)",
        "Battery: 3800 mAh Li-ion",
      ].join("\n"),
      images: ["/placeholder-product.svg"],
      status: "ACTIVE" as const,
      isNewArrival: false,
      isBestSeller: true,
      priceCadCents: 54900,
      priceUsdCents: 40000,
      saleCadCents: 49900,
      saleUsdCents: 35000,
      hasVariants: false,
      categories: ["nationwide-radios"],
      industries: ["construction", "security"],
    },
    {
      name: "Hytera BD502i Business Radio",
      slug: "hytera-bd502i-business-radio",
      brand: "Hytera",
      description:
        "The Hytera BD502i is a lightweight, easy-to-use digital business radio designed for discreet, all-day communication in retail and hospitality environments. Analog/digital compatibility makes it a simple upgrade path.",
      shortDescription: "Lightweight digital/analog business radio for retail and hospitality.",
      specifications: [
        "Model: Hytera BD502i",
        "Platform: Digital/Analog (DMR Tier II)",
        "Channels: 48",
        "Frequency Band: UHF 400-470 MHz",
        "Ingress Protection: IP54",
        "Battery: 1500 mAh Li-ion",
        "License Required: Yes — FCC",
      ].join("\n"),
      images: ["/placeholder-product.svg"],
      status: "ACTIVE" as const,
      isNewArrival: false,
      isBestSeller: false,
      priceCadCents: 29590,
      priceUsdCents: 25200,
      hasVariants: false,
      categories: ["business-radios"],
      industries: ["retail", "hospitality"],
    },
    {
      name: "Hytera SM16A1 Remote Speaker Microphone",
      slug: "hytera-sm16a1-speaker-mic",
      brand: "Hytera",
      description:
        "Rugged IP67 remote speaker microphone with a large PTT button and 3.5mm audio jack. Compatible with Hytera HP and PD series radios for clear, hands-on communication.",
      shortDescription: "IP67 remote speaker microphone with large PTT button.",
      specifications: [
        "Model: Hytera SM16A1",
        "Type: Remote Speaker Microphone",
        "Ingress Protection: IP67",
        "Audio Jack: 3.5mm",
        "Compatibility: Hytera HP / PD series",
      ].join("\n"),
      images: ["/placeholder-product.svg"],
      status: "ACTIVE" as const,
      isNewArrival: false,
      isBestSeller: true,
      priceCadCents: 7990,
      priceUsdCents: 5900,
      saleCadCents: 6490,
      saleUsdCents: 4900,
      hasVariants: false,
      categories: ["accessories"],
      industries: ["security", "retail"],
    },
    {
      name: "Hytera ESW02 Wireless Bluetooth Earpiece",
      slug: "hytera-esw02-wireless-earpiece",
      brand: "Hytera",
      description:
        "Discreet wireless Bluetooth earpiece with inline push-to-talk. Frees your team from cables while keeping communication private and clear.",
      shortDescription: "Discreet wireless Bluetooth earpiece with inline PTT.",
      specifications: [
        "Model: Hytera ESW02",
        "Type: Wireless Bluetooth Earpiece",
        "Connectivity: Bluetooth",
        "Battery: Rechargeable Li-ion",
        "Compatibility: Bluetooth-enabled Hytera radios",
      ].join("\n"),
      images: ["/placeholder-product.svg"],
      status: "ACTIVE" as const,
      isNewArrival: true,
      isBestSeller: false,
      priceCadCents: 12900,
      priceUsdCents: 9900,
      hasVariants: false,
      categories: ["accessories"],
      industries: ["healthcare", "schools"],
    },
  ];

  for (const productData of products) {
    const {
      categories: catSlugs,
      industries: indSlugs,
      options,
      variants,
      reviews: productReviews,
      ...productFields
    } = productData;

    const product = await prisma.product.upsert({
      where: { slug: productFields.slug },
      update: productFields,
      create: productFields,
    });

    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    await prisma.productIndustry.deleteMany({ where: { productId: product.id } });

    await prisma.productCategory.createMany({
      data: catSlugs.map((slug) => ({
        productId: product.id,
        categoryId: categoryMap[slug],
      })),
    });

    await prisma.productIndustry.createMany({
      data: indSlugs.map((slug) => ({
        productId: product.id,
        industryId: industryMap[slug],
      })),
    });

    if (options?.length) {
      await prisma.productOption.deleteMany({ where: { productId: product.id } });
      await prisma.productVariant.deleteMany({ where: { productId: product.id } });

      const valueIdByName: Record<string, string> = {};
      for (const [position, option] of options.entries()) {
        const createdOption = await prisma.productOption.create({
          data: {
            productId: product.id,
            name: option.name,
            position,
            values: {
              create: option.values.map((value, index) => ({ value, position: index })),
            },
          },
          include: { values: true },
        });
        for (const v of createdOption.values) valueIdByName[v.value] = v.id;
      }

      if (variants?.length) {
        for (const variant of variants) {
          const optionValueIds = variant.options
            .map((name) => valueIdByName[name])
            .filter((id): id is string => Boolean(id));

          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: variant.sku,
              stock: variant.stock,
              priceCadCents: variant.priceCadCents ?? null,
              priceUsdCents: variant.priceUsdCents ?? null,
              options: {
                create: optionValueIds.map((optionValueId) => ({ optionValueId })),
              },
            },
          });
        }
      }
    }

    await prisma.review.deleteMany({ where: { productId: product.id } });
    if (productReviews?.length) {
      await prisma.review.createMany({
        data: productReviews.map((r) => ({
          productId: product.id,
          author: r.author,
          content: r.content,
          rating: r.rating,
          featured: false,
        })),
      });
    }
  }

  const reviews = [
    {
      author: "Jessica Chapman",
      content:
        "Great radios at a reasonable price, and they shipped quickly! The team helped me pick the right model for our warehouse.",
      rating: 5,
      featured: true,
    },
    {
      author: "Eric M.",
      content:
        "Amazing customer service! Great product and fast response. I'm a repeat customer time and time again.",
      rating: 5,
      featured: true,
    },
    {
      author: "Director of Operations",
      content:
        "We have been working with this team since 2017, and they always come through with great communication solutions.",
      rating: 5,
      featured: true,
    },
    {
      author: "Matt A.",
      content:
        "Bought these for my team across multiple locations. Nationwide coverage with no monthly fees is a game changer.",
      rating: 5,
      featured: true,
    },
  ];

  await prisma.review.deleteMany({ where: { featured: true } });
  await prisma.review.createMany({ data: reviews });

  console.log("Seed completed successfully.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
