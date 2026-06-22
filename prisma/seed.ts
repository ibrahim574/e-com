import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// MSRP in the pricebook is CAD. Approximate USD at a fixed rate for the demo.
const USD_RATE = 0.73;
const cadCents = (dollars: number) => Math.round(dollars * 100);
const usdCents = (dollars: number) => Math.round(dollars * USD_RATE) * 100;

const PROGRAMMING_VALUES = ["Default Frequency", "Custom Frequency"];

type Band = { label: string; sku: string; cad: number; stock?: number };

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
  images?: string[];
  status?: "ACTIVE" | "DRAFT";
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  // Accessories set a flat price directly:
  priceCad?: number;
  saleCad?: number | null;
  // Radios derive price/variants from bands:
  bands?: Band[];
  programming?: boolean;
  categories: string[];
  industries: string[];
  reviews?: SeedReview[];
};

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "ADMIN" },
    create: { email: adminEmail, name: "Store Admin", passwordHash, role: "ADMIN" },
  });

  const categories = [
    { name: "Professional Radios", slug: "professional-radios", description: "Fully-featured HP-series DMR portables for security, emergency, and industrial use." },
    { name: "Business Radios", slug: "business-radios", description: "Easy-to-use BP, BD, and PD portables for onsite and business communication." },
    { name: "Commercial Radios", slug: "commercial-radios", description: "Durable mid-tier digital radios with extended range and battery life." },
    { name: "Mobile Radios", slug: "mobile-radios", description: "In-vehicle HM and MD mobile radios for fleets and dispatch." },
    { name: "Repeaters", slug: "repeaters", description: "HR-series repeaters and infrastructure to extend coverage across your site." },
    { name: "Intrinsically Safe", slug: "intrinsically-safe", description: "ATEX/IECEx and UL913 certified radios for mining, oil, gas, and hazardous areas." },
    { name: "Nationwide Radios", slug: "nationwide-radios", description: "Dual-mode LTE & DMR terminals with nationwide push-to-talk." },
    { name: "Accessories", slug: "accessories", description: "Batteries, chargers, speaker mics, earpieces, and more." },
  ];

  for (const category of categories) {
    await prisma.category.upsert({ where: { slug: category.slug }, update: category, create: category });
  }

  const industries = [
    { name: "Schools", slug: "schools", description: "Campus-wide communication for safety and logistics." },
    { name: "Security", slug: "security", description: "Instant PTT for patrols and incident response." },
    { name: "Retail Stores", slug: "retail", description: "Compact radios for floor coordination." },
    { name: "Construction", slug: "construction", description: "Rugged radios built for active job sites." },
    { name: "Hospitality", slug: "hospitality", description: "Discreet radios for hotels and restaurants." },
    { name: "Healthcare", slug: "healthcare", description: "Reliable communication for care teams." },
    { name: "Mining & Energy", slug: "mining-energy", description: "Intrinsically safe radios for hazardous environments." },
  ];

  for (const industry of industries) {
    await prisma.industry.upsert({ where: { slug: industry.slug }, update: industry, create: industry });
  }

  const categoryMap = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));
  const industryMap = Object.fromEntries((await prisma.industry.findMany()).map((i) => [i.slug, i.id]));

  const UHF350 = "UHF (350-470 MHz)";
  const UHF400 = "UHF (400-470 MHz)";
  const UHF527 = "UHF (400-527 MHz)";
  const UHF480 = "UHF (400-480 MHz)";
  const VHF = "VHF (136-174 MHz)";
  const B800 = "800/900 (806-941 MHz)";

  const products: SeedProduct[] = [
    // ---------- PROFESSIONAL (HP series) ----------
    {
      name: "Hytera HP782 Fully Featured Digital Two-Way Radio with Display",
      slug: "hytera-hp782-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera HP782 is the flagship of the HP-series — a fully featured, high-performance DMR portable built for security, emergency, and industrial teams that demand the very best. A bright 2.4\" color display, AI-based noise cancellation, and an IP68 / MIL-STD-810 body keep you heard and connected in the toughest conditions.\n\nKey features\n• 1,024 channels across 64 zones\n• DMR, Analog, XPT & Tier III Trunking modes\n• AI-Based Noise Cancellation for crystal-clear audio\n• IP68 and MIL-STD-810 C/D/E/F/G rugged build\n• 24-hour battery life (2,400 mAh Li-Po)\n• Lone Worker & Man Down safety with dedicated orange emergency button\n• Strong digital encryption (ARC4), AES256 capable (license)\n• Bluetooth 5.0 and GPS on G-BT models\n\nSelect your frequency band and programming option above. Choose Custom Frequency to have our team program the radio to your existing fleet before it ships.",
      shortDescription:
        "Flagship fully-featured DMR portable with 2.4\" color display, AI noise cancellation, and IP68 rugged build.",
      specifications: [
        "Model: Hytera HP782",
        "Platform: Digital (DMR), Analog, XPT & Tier III Trunking",
        "Frequency Bands: UHF 350-470 MHz / VHF 136-174 MHz / 806-941 MHz",
        "Channels: 1,024 (64 Zones)",
        "Display: 2.4\" Color LCD, 320x240",
        "Battery: 2,400 mAh Li-Po, up to 24h",
        "Ingress / Durability: IP68, MIL-STD-810 C/D/E/F/G",
        "Audio: AI-Based Noise Cancellation",
        "Connectivity: Bluetooth 5.0, GPS (model specific)",
        "Encryption: ARC4, AES256 (license required)",
        "Size: 132 x 55 x 29.5 mm (without antenna)",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      isNewArrival: true,
      isBestSeller: true,
      bands: [
        { label: UHF350, sku: "HP782-Uv", cad: 1197, stock: 22 },
        { label: VHF, sku: "HP782-V1", cad: 1197, stock: 18 },
        { label: B800, sku: "HP782-U5", cad: 1197, stock: 12 },
      ],
      programming: true,
      categories: ["professional-radios"],
      industries: ["security", "construction", "mining-energy"],
      reviews: [
        { author: "Daniel R.", content: "Audio is incredibly clear even on our noisy plant floor. Custom programming arrived ready to go.", rating: 5 },
        { author: "Site Safety Lead", content: "Rugged, reliable, and the battery easily lasts a full shift. The Man Down feature gives us peace of mind.", rating: 5 },
        { author: "Megan T.", content: "Great upgrade from our old analog fleet. Programmed to match our channels perfectly.", rating: 4 },
      ],
    },
    {
      name: "Hytera HP702 Fully Featured Digital Two-Way Radio",
      slug: "hytera-hp702-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera HP702 packs the same fully-featured HP-series performance into a non-display design with a crisp 0.91\" OLED status screen. Ideal for teams that want flagship audio, ruggedness, and battery life without a full color display.\n\nKey features\n• 1,024 channels, 64 zones\n• DMR, Analog, XPT & Tier III Trunking modes\n• AI-Based Noise Cancellation\n• IP68 and MIL-STD-810 C/D/E/F/G rugged build\n• 24-hour battery life (2,400 mAh Li-Po)\n• Lone Worker & Man Down safety, dedicated orange button\n• Bluetooth 5.0 and GPS on G-BT models\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Fully-featured non-display HP-series DMR portable with OLED status screen and 24h battery.",
      specifications: [
        "Model: Hytera HP702",
        "Platform: Digital (DMR), Analog, XPT & Tier III Trunking",
        "Frequency Bands: UHF 350-470 MHz / VHF 136-174 MHz",
        "Channels: 1,024 (64 Zones)",
        "Display: 0.91\" OLED White",
        "Battery: 2,400 mAh Li-Po, up to 24h",
        "Ingress / Durability: IP68, MIL-STD-810 C/D/E/F/G",
        "Audio: AI-Based Noise Cancellation",
        "Connectivity: Bluetooth 5.0, GPS (model specific)",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      isBestSeller: true,
      bands: [
        { label: UHF350, sku: "HP702-Uv", cad: 1003, stock: 24 },
        { label: VHF, sku: "HP702-V1", cad: 1003, stock: 20 },
      ],
      programming: true,
      categories: ["professional-radios"],
      industries: ["security", "construction"],
    },
    {
      name: "Hytera HP682 Advanced Digital Two-Way Radio with Display",
      slug: "hytera-hp682-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera HP682 is an advanced high-performance DMR portable with a 1.8\" color display, AI noise cancellation, and an IP67 rugged body — a versatile choice for professional users across many industries.\n\nKey features\n• 1,024 channels, 64 zones\n• DMR, Analog & XPT Trunking modes\n• 1.8\" LCD graphic color display\n• AI-Based Noise Cancellation\n• IP67 and MIL-STD-810 C/D/E/F/G\n• Lone Worker & Man Down safety\n• Bluetooth 5.0 and GPS on G-BT models\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Advanced DMR portable with 1.8\" color display, AI noise cancellation, and IP67 build.",
      specifications: [
        "Model: Hytera HP682",
        "Platform: Digital (DMR), Analog & XPT Trunking",
        "Frequency Bands: UHF 400-527 MHz / VHF 136-174 MHz",
        "Channels: 1,024 (64 Zones)",
        "Display: 1.8\" Color LCD",
        "Battery: 2,000 mAh Li-Po, up to 20h",
        "Ingress / Durability: IP67, MIL-STD-810 C/D/E/F/G",
        "Connectivity: Bluetooth 5.0, GPS (model specific)",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      bands: [
        { label: UHF527, sku: "HP682-Um", cad: 1002, stock: 20 },
        { label: VHF, sku: "HP682-V1", cad: 1002, stock: 16 },
      ],
      programming: true,
      categories: ["professional-radios"],
      industries: ["security", "healthcare"],
    },
    {
      name: "Hytera HP602 Advanced Digital Two-Way Radio",
      slug: "hytera-hp602-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera HP602 delivers advanced HP-series performance in a compact, lightweight non-display design. AI noise cancellation and an IP67 body make it a dependable everyday workhorse.\n\nKey features\n• 1,024 channels, 64 zones\n• DMR, Analog & XPT Trunking modes\n• 0.91\" OLED status display\n• AI-Based Noise Cancellation\n• IP67 and MIL-STD-810 C/D/E/F/G\n• Bluetooth 5.0 and GPS on G-BT models\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Compact advanced DMR portable with AI noise cancellation and IP67 ruggedness.",
      specifications: [
        "Model: Hytera HP602",
        "Platform: Digital (DMR), Analog & XPT Trunking",
        "Frequency Bands: UHF 400-527 MHz / VHF 136-174 MHz",
        "Channels: 1,024 (64 Zones)",
        "Display: 0.91\" OLED White",
        "Battery: 2,000 mAh Li-Po, up to 20h",
        "Ingress / Durability: IP67, MIL-STD-810 C/D/E/F/G",
        "Connectivity: Bluetooth 5.0, GPS (model specific)",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      isBestSeller: true,
      bands: [
        { label: UHF527, sku: "HP602-Um", cad: 889, stock: 30 },
        { label: VHF, sku: "HP602-V1", cad: 889, stock: 26 },
      ],
      programming: true,
      categories: ["professional-radios", "commercial-radios"],
      industries: ["retail", "hospitality"],
    },
    {
      name: "Hytera HP56X High Performance Digital Radio with Display",
      slug: "hytera-hp56x-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera HP56X brings high-performance audio and a 1.45\" color display to a simple, value-focused package. AI noise cancellation and IP67 ruggedness keep teams clear and connected.\n\nKey features\n• 512 channels, 32 zones\n• DMR, Analog & optional XPT Trunking\n• 1.45\" color LCD display\n• AI-Based Noise Cancellation\n• IP67 and MIL-STD-810 C/D/E/F/G\n• Bluetooth 5.2 and GPS on select models\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Simple high-performance DMR portable with color display, AI noise cancellation, IP67.",
      specifications: [
        "Model: Hytera HP56X",
        "Platform: Digital (DMR), Analog & optional XPT Trunking",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz",
        "Channels: 512 (32 Zones)",
        "Display: 1.45\" Color LCD, 240x320",
        "Battery: 1,500 mAh Li-ion, up to 15h",
        "Ingress / Durability: IP67, MIL-STD-810 C/D/E/F/G",
        "Connectivity: Bluetooth 5.2, GPS (model specific)",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      isNewArrival: true,
      bands: [
        { label: UHF400, sku: "HP56X-U1", cad: 679, stock: 28 },
        { label: VHF, sku: "HP56X-V1", cad: 679, stock: 24 },
      ],
      programming: true,
      categories: ["professional-radios", "commercial-radios"],
      industries: ["construction", "schools"],
    },
    {
      name: "Hytera HP50X High Performance Digital Radio",
      slug: "hytera-hp50x-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera HP50X is the most affordable HP-series portable, delivering high-performance audio and ruggedness in a straightforward non-display design.\n\nKey features\n• 256 channels, 16 zones\n• DMR, Analog & optional XPT Trunking\n• AI-Based Noise Cancellation\n• IP67 and MIL-STD-810 C/D/E/F/G\n• Bluetooth 5.2 and GPS on select models\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Affordable high-performance DMR portable with AI noise cancellation and IP67 build.",
      specifications: [
        "Model: Hytera HP50X",
        "Platform: Digital (DMR), Analog & optional XPT Trunking",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz",
        "Channels: 256 (16 Zones)",
        "Battery: 1,500 mAh Li-ion, up to 15h",
        "Ingress / Durability: IP67, MIL-STD-810 C/D/E/F/G",
        "Connectivity: Bluetooth 5.2, GPS (model specific)",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      bands: [
        { label: UHF400, sku: "HP50X-U1", cad: 583, stock: 34 },
        { label: VHF, sku: "HP50X-V1", cad: 583, stock: 30 },
      ],
      programming: true,
      categories: ["commercial-radios"],
      industries: ["retail", "schools"],
    },

    // ---------- BUSINESS (BP / BD / PD) ----------
    {
      name: "Hytera BP562 Next Generation Business Radio with Display",
      slug: "hytera-bp562-business-radio",
      brand: "Hytera",
      description:
        "The Hytera BP562 is a next-generation business DMR portable with a 1.77\" color display, intelligent noise suppression, and convenient USB Type-C charging. Lightweight and easy to use for everyday teams.\n\nKey features\n• 128 channels, 8 zones\n• DMR & Analog conventional modes\n• 1.77\" TFT color display\n• Intelligent Noise Suppression, 3W audio\n• IP54 / IP67 (model dependent), MIL-STD-810G\n• USB Type-C charging\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Next-gen business DMR radio with color display, noise suppression, and USB-C charging.",
      specifications: [
        "Model: Hytera BP562",
        "Platform: Digital (DMR) & Analog conventional",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz",
        "Channels: 128 (8 Zones)",
        "Display: 1.77\" TFT Color",
        "Battery: 1,500 mAh (2,400 mAh optional), up to 21h",
        "Ingress / Durability: IP54 / IP67 (model dependent), MIL-STD-810G",
        "Charging: USB Type-C",
        "Warranty: 3 Year Standard (Radio only)",
      ].join("\n"),
      bands: [
        { label: UHF400, sku: "BP562-U1", cad: 362, stock: 40 },
        { label: VHF, sku: "BP562-V1", cad: 362, stock: 32 },
      ],
      programming: true,
      categories: ["business-radios"],
      industries: ["retail", "hospitality"],
    },
    {
      name: "Hytera BP512 Next Generation Business Radio",
      slug: "hytera-bp512-business-radio",
      brand: "Hytera",
      description:
        "The Hytera BP512 is a compact, lightweight next-generation business radio with intelligent noise suppression and USB Type-C charging — perfect for retail, hospitality, and onsite teams.\n\nKey features\n• 64 channels, 4 zones\n• DMR & Analog conventional modes\n• Intelligent Noise Suppression, 3W audio\n• IP54 / IP67 (model dependent), MIL-STD-810G\n• USB Type-C charging\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Compact next-gen business DMR radio with noise suppression and USB-C charging.",
      specifications: [
        "Model: Hytera BP512",
        "Platform: Digital (DMR) & Analog conventional",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz",
        "Channels: 64 (4 Zones)",
        "Battery: 1,500 mAh (2,400 mAh optional), up to 21h",
        "Ingress / Durability: IP54 / IP67 (model dependent), MIL-STD-810G",
        "Charging: USB Type-C",
        "Warranty: 3 Year Standard (Radio only)",
      ].join("\n"),
      isBestSeller: true,
      bands: [
        { label: UHF400, sku: "BP512-U1", cad: 330, stock: 44 },
        { label: VHF, sku: "BP512-V1", cad: 330, stock: 38 },
      ],
      programming: true,
      categories: ["business-radios"],
      industries: ["retail", "hospitality"],
    },
    {
      name: "Hytera BD552i Business Portable Digital Radio with Display",
      slug: "hytera-bd552i-business-radio",
      brand: "Hytera",
      description:
        "The Hytera BD552i is a dependable business DMR radio with a single-line OLED display for aliases and IDs. Mixed analog/digital receive makes it an easy upgrade path.\n\nKey features\n• 256 channels, 16 zones\n• DMR & Analog conventional modes\n• Single-line OLED display\n• MIL-STD-810 C/D/E/F/G, IP54\n• Bluetooth (model specific)\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Business DMR radio with OLED alias display and mixed analog/digital receive.",
      specifications: [
        "Model: Hytera BD552i",
        "Platform: Digital (DMR) & Analog conventional",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz",
        "Channels: 256 (16 Zones)",
        "Display: Single-line OLED",
        "Battery: 1,500 mAh (2,000 mAh optional), up to 21h",
        "Ingress / Durability: IP54, MIL-STD-810 C/D/E/F/G",
        "Connectivity: Bluetooth (model specific)",
        "Warranty: 3 Year Standard (Radio only)",
      ].join("\n"),
      bands: [
        { label: UHF400, sku: "BD552i-U1", cad: 359, stock: 36 },
        { label: VHF, sku: "BD552i-V1", cad: 359, stock: 30 },
      ],
      programming: true,
      categories: ["business-radios"],
      industries: ["hospitality", "healthcare"],
    },
    {
      name: "Hytera BD612i Rugged Business Portable Digital Radio",
      slug: "hytera-bd612i-business-radio",
      brand: "Hytera",
      description:
        "The Hytera BD612i is a rugged IP66 business DMR radio built for tougher environments, with analog and digital emergency alarms for added safety.\n\nKey features\n• 48 channels, 3 zones\n• DMR & Analog conventional modes\n• IP66 ingress, MIL-STD-810 C/D/E/F/G\n• Analog & digital emergency alarm\n• Mixed analog/digital receive\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Rugged IP66 business DMR radio with analog & digital emergency alarms.",
      specifications: [
        "Model: Hytera BD612i",
        "Platform: Digital (DMR) & Analog conventional",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz",
        "Channels: 48 (3 Zones)",
        "Battery: 1,500 mAh (2,000 mAh optional), up to 21h",
        "Ingress / Durability: IP66, MIL-STD-810 C/D/E/F/G",
        "Warranty: 3 Year Standard (Radio only)",
      ].join("\n"),
      isNewArrival: true,
      bands: [
        { label: UHF400, sku: "BD612i-U1", cad: 359, stock: 34 },
        { label: VHF, sku: "BD612i-V1", cad: 359, stock: 28 },
      ],
      programming: true,
      categories: ["business-radios"],
      industries: ["construction", "security"],
    },
    {
      name: "Hytera BD502i Business Portable Digital Radio",
      slug: "hytera-bd502i-business-radio",
      brand: "Hytera",
      description:
        "The Hytera BD502i is a simple, affordable business DMR radio with analog and digital emergency alarms — an easy, reliable choice for retail and hospitality teams.\n\nKey features\n• 48 channels, 3 zones\n• DMR & Analog conventional modes\n• MIL-STD-810 C/D/E/F/G, IP54\n• Analog & digital emergency alarm\n• Mixed analog/digital receive\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Simple, affordable business DMR radio with emergency alarms and rugged build.",
      specifications: [
        "Model: Hytera BD502i",
        "Platform: Digital (DMR) & Analog conventional",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz",
        "Channels: 48 (3 Zones)",
        "Battery: 1,500 mAh (2,000 mAh optional), up to 21h",
        "Ingress / Durability: IP54, MIL-STD-810 C/D/E/F/G",
        "Warranty: 3 Year Standard (Radio only)",
      ].join("\n"),
      bands: [
        { label: UHF400, sku: "BD502i-U1", cad: 323, stock: 42 },
        { label: VHF, sku: "BD502i-V1", cad: 323, stock: 36 },
      ],
      programming: true,
      categories: ["business-radios"],
      industries: ["retail", "hospitality"],
    },
    {
      name: "Hytera PD482i Simple Portable Digital Radio with Display",
      slug: "hytera-pd482i-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera PD482i is a simple, dependable DMR portable with a 3-line OLED display and full keypad, supporting text messaging and one-touch calls.\n\nKey features\n• 256 channels, 16 zones\n• Dual mode (Analog & Digital)\n• 3-line OLED display, full keypad\n• MIL-STD-810 C/D/E/F/G, IP54\n• Text messaging & one-touch call\n• GPS & Bluetooth on G-BT models\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Simple DMR portable with 3-line OLED display, full keypad, and text messaging.",
      specifications: [
        "Model: Hytera PD482i",
        "Platform: Digital (DMR) & Analog",
        "Frequency Bands: UHF 350-470 MHz / VHF 136-174 MHz",
        "Channels: 256 (16 Zones)",
        "Display: 3-line OLED, full keypad",
        "Battery: up to 16h (5/5/90)",
        "Ingress / Durability: IP54, MIL-STD-810 C/D/E/F/G",
        "Connectivity: GPS & Bluetooth (model specific)",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      bands: [
        { label: UHF350, sku: "PD482i-Uv", cad: 520, stock: 26 },
        { label: VHF, sku: "PD482i-V1", cad: 520, stock: 22 },
      ],
      programming: true,
      categories: ["business-radios", "commercial-radios"],
      industries: ["schools", "healthcare"],
    },
    {
      name: "Hytera PD402i Simple Portable Digital Radio",
      slug: "hytera-pd402i-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera PD402i is a no-frills dual-mode DMR portable that's simple to use and built to last, with pseudo trunk support and one-touch calling.\n\nKey features\n• 48 channels, 3 zones\n• Dual mode (Analog & Digital)\n• MIL-STD-810 C/D/E/F/G, IP55\n• Pseudo Trunk support\n• One-touch call / text message\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "No-frills dual-mode DMR portable, simple to use and built to last.",
      specifications: [
        "Model: Hytera PD402i",
        "Platform: Digital (DMR) & Analog",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz",
        "Channels: 48 (3 Zones)",
        "Battery: up to 16h (5/5/90)",
        "Ingress / Durability: IP55, MIL-STD-810 C/D/E/F/G",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      bands: [
        { label: UHF400, sku: "PD402i-U1", cad: 452, stock: 30 },
        { label: VHF, sku: "PD402i-V1", cad: 452, stock: 26 },
      ],
      programming: true,
      categories: ["business-radios"],
      industries: ["retail", "construction"],
    },
    {
      name: "Hytera PD362i Slim Pocket-Size Portable Digital Radio",
      slug: "hytera-pd362i-digital-radio",
      brand: "Hytera",
      description:
        "The Hytera PD362i is an ultra-slim, pocket-size DMR radio weighing just 160g, with a 3-line display and optional wireless charging — perfect for discreet, all-day use.\n\nKey features\n• 256 channels, 16 zones\n• Dual mode (Analog & Digital)\n• Slim, pocket-size design (160g)\n• MIL-STD-810 C/D/E/F/G, IP54\n• Optional wireless charging\n• Roaming in multi-site repeater systems\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Ultra-slim 160g pocket DMR radio with 3-line display and optional wireless charging.",
      specifications: [
        "Model: Hytera PD362i",
        "Platform: Digital (DMR) & Analog",
        "Frequency Band: UHF 400-470 MHz",
        "Channels: 256 (16 Zones)",
        "Weight: 160g",
        "Display: 3-line monochrome",
        "Battery: up to 15h (5/5/90)",
        "Ingress / Durability: IP54, MIL-STD-810 C/D/E/F/G",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      bands: [{ label: UHF400, sku: "PD362i-Uc", cad: 463, stock: 33 }],
      programming: true,
      categories: ["business-radios"],
      industries: ["retail", "hospitality"],
    },

    // ---------- MOBILE (HM / MD) ----------
    {
      name: "Hytera HM782 High Performance Multimode Mobile Radio",
      slug: "hytera-hm782-mobile-radio",
      brand: "Hytera",
      description:
        "The Hytera HM782 is a high-performance multimode mobile (in-vehicle) radio with a 2.4\" color display, AI noise cancellation, and up to 50W of power for wide-area fleet coverage.\n\nKey features\n• 1,024 channels, 64 zones\n• DMR, Analog & XPT Trunking modes\n• 2.4\" color display\n• Up to 50W transmit power\n• AI-Based Noise Cancellation\n• IP54, MIL-STD-810 C/D/E/F/G\n• Bluetooth 5.0 and GPS on G-BT models\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "High-performance multimode mobile radio with color display, AI noise cancellation, up to 50W.",
      specifications: [
        "Model: Hytera HM782",
        "Platform: Digital (DMR), Analog & XPT Trunking",
        "Frequency Bands: UHF 350-470 MHz / VHF 136-174 MHz / 806-941 MHz",
        "Channels: 1,024 (64 Zones)",
        "Power: up to 50W",
        "Display: 2.4\" Color LCD",
        "Ingress / Durability: IP54, MIL-STD-810 C/D/E/F/G",
        "Connectivity: Bluetooth 5.0, GPS (model specific)",
        "Warranty: 3 Year Standard (Radio only)",
      ].join("\n"),
      isBestSeller: true,
      bands: [
        { label: UHF350, sku: "HM782-Uv", cad: 1164, stock: 18 },
        { label: VHF, sku: "HM782-V1", cad: 1164, stock: 16 },
        { label: B800, sku: "HM782-U5", cad: 1164, stock: 10 },
      ],
      programming: true,
      categories: ["mobile-radios"],
      industries: ["construction", "security", "mining-energy"],
    },
    {
      name: "Hytera HM682 Compact Mobile Radio with Display",
      slug: "hytera-hm682-mobile-radio",
      brand: "Hytera",
      description:
        "The Hytera HM682 is a performance compact mobile radio with a 1.45\" color display and AI noise cancellation — a great fit for vehicles where space is tight.\n\nKey features\n• 512 channels, 32 zones\n• DMR, Analog & optional XPT Trunking\n• 1.45\" color display\n• Up to 50W transmit power\n• AI-Based Noise Cancellation\n• IP54, MIL-STD-810 C/D/E/F/G/H\n• Bluetooth 5.0 and GPS on G-BT models\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Compact mobile radio with color display, AI noise cancellation, up to 50W.",
      specifications: [
        "Model: Hytera HM682",
        "Platform: Digital (DMR), Analog & optional XPT Trunking",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz",
        "Channels: 512 (32 Zones)",
        "Power: up to 50W",
        "Display: 1.45\" Color LCD",
        "Ingress / Durability: IP54, MIL-STD-810 C/D/E/F/G/H",
        "Connectivity: Bluetooth 5.0, GPS (model specific)",
        "Warranty: 3 Year Standard (Radio only)",
      ].join("\n"),
      bands: [
        { label: UHF400, sku: "HM682-U1", cad: 825, stock: 20 },
        { label: VHF, sku: "HM682-V1", cad: 825, stock: 18 },
      ],
      programming: true,
      categories: ["mobile-radios"],
      industries: ["construction", "security"],
    },
    {
      name: "Hytera MD622i Commercial Digital Mobile Radio with Display",
      slug: "hytera-md622i-mobile-radio",
      brand: "Hytera",
      description:
        "The Hytera MD622i is a commercial digital mobile radio with a 4-line display, Bluetooth 5.0, and multi-site roaming — a solid, budget-friendly fleet radio.\n\nKey features\n• 256 channels, 16 zones\n• Dual mode (Analog & Digital)\n• 1.5\" 4-line display\n• Bluetooth 5.0 integration\n• Channel scan & multi-site roaming\n• IP54, MIL-STD-810 C/D/E/F/G\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Commercial digital mobile radio with 4-line display, Bluetooth, and multi-site roaming.",
      specifications: [
        "Model: Hytera MD622i",
        "Platform: Digital (DMR) & Analog conventional",
        "Frequency Band: VHF 136-174 MHz",
        "Channels: 256 (16 Zones)",
        "Power: 5-50W",
        "Display: 1.5\" 4-line",
        "Connectivity: Bluetooth 5.0, GPS optional",
        "Ingress / Durability: IP54, MIL-STD-810 C/D/E/F/G",
        "Warranty: 3 Year Standard (Radio only)",
      ].join("\n"),
      bands: [{ label: VHF, sku: "MD622i-V1", cad: 673, stock: 22 }],
      programming: true,
      categories: ["mobile-radios", "commercial-radios"],
      industries: ["security", "construction"],
    },

    // ---------- NATIONWIDE / DUAL MODE ----------
    {
      name: "Hytera PDC680 All-in-One Dual-Mode LTE & DMR Terminal",
      slug: "hytera-pdc680-dual-mode-radio",
      brand: "Hytera",
      description:
        "The Hytera PDC680 is a flagship all-in-one terminal that combines DMR (LMR) and 4G LTE broadband PoC in a single rugged device. A large 3.6\" touchscreen, 8-core CPU, Wi-Fi, and dual-mode PTT broadcast let teams talk locally over DMR and nationwide over LTE — all from one radio.\n\nKey features\n• Dual-mode DMR + 4G LTE PoC, dual-network PTT broadcast\n• 3.6\" color touchscreen (1280x720), Android platform\n• AI-Based Noise Cancellation, 2W audio\n• IP68 and MIL-STD-810 C/D/E/F/G\n• Wi-Fi 2.4/5GHz, Bluetooth 4.2, NFC, GPS\n• 8-core CPU @ 1.8GHz, 3GB RAM / 32GB Flash\n• Lone Worker & Man Down safety, orange emergency button\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "All-in-one dual-mode LTE + DMR terminal with 3.6\" touchscreen and nationwide PoC.",
      specifications: [
        "Model: Hytera PDC680",
        "Platform: Dual-Mode DMR (LMR) + 4G LTE PoC",
        "Frequency Bands: UHF 340-470 MHz / VHF 136-174 MHz",
        "Operating System: Android",
        "Display: 3.6\" Color Touchscreen, 1280x720",
        "Processor: 8-core @ 1.8GHz, 3GB RAM / 32GB Flash",
        "Connectivity: 4G LTE, Wi-Fi 2.4/5GHz, Bluetooth 4.2, NFC, GPS",
        "Battery: 2,400 mAh (4,000 mAh optional)",
        "Ingress / Durability: IP68, MIL-STD-810 C/D/E/F/G",
        "Warranty: 3 Year Standard (Radio only)",
      ].join("\n"),
      isNewArrival: true,
      isBestSeller: true,
      bands: [
        { label: "UHF (340-470 MHz)", sku: "PDC680-Uv", cad: 2247, stock: 14 },
        { label: VHF, sku: "PDC680-V1", cad: 2247, stock: 12 },
      ],
      programming: true,
      categories: ["nationwide-radios"],
      industries: ["security", "construction"],
      reviews: [
        { author: "Operations Director", content: "One device for our local sites and our nationwide crews. The touchscreen and LTE coverage are game changers.", rating: 5 },
        { author: "Fleet Manager", content: "Rugged, fast, and the dual-mode PTT just works. Setup support was excellent.", rating: 5 },
      ],
    },

    // ---------- INTRINSICALLY SAFE ----------
    {
      name: "Hytera HP792Ex-IIA Intrinsically Safe Radio with Display (ATEX/IECEx)",
      slug: "hytera-hp792ex-iia-radio",
      brand: "Hytera",
      description:
        "The Hytera HP792Ex-IIA is an ATEX / IECEx certified intrinsically safe DMR portable for hazardous environments such as oil, gas, chemical, and mining. It pairs full HP-series performance with a 2.4\" color display, Wi-Fi, GPS, and Bluetooth 5.3.\n\nKey features\n• ATEX/IECEx: Class I Zone 1 AEx IIA T4 Gb\n• 1,024 channels, 64 zones\n• DMR, Analog, XPT & Tier III Trunking\n• 2.4\" color display, AI noise cancellation\n• IP68, MIL-STD-810 C/D/E/F/G/H\n• Bluetooth 5.3, Wi-Fi 2.4GHz, NFC, GPS\n• Lone Worker & Man Down safety\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "ATEX/IECEx intrinsically safe DMR portable with color display, Wi-Fi, GPS, Bluetooth 5.3.",
      specifications: [
        "Model: Hytera HP792Ex-IIA",
        "Certification: ATEX/IECEx Class I Zone 1 AEx IIA T4 Gb",
        "Platform: Digital (DMR), Analog, XPT & Tier III Trunking",
        "Frequency Bands: UHF 400-480 MHz / VHF 136-174 MHz",
        "Channels: 1,024 (64 Zones)",
        "Display: 2.4\" Color LCD, 320x240",
        "Battery: 2,150 mAh Li-ion, up to 22h",
        "Ingress / Durability: IP68, MIL-STD-810 C/D/E/F/G/H",
        "Connectivity: Bluetooth 5.3, Wi-Fi 2.4GHz, NFC, GPS",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      bands: [
        { label: UHF480, sku: "HP792Ex-IIA-U1", cad: 2765, stock: 8 },
        { label: VHF, sku: "HP792Ex-IIA-V1", cad: 2765, stock: 6 },
      ],
      programming: true,
      categories: ["intrinsically-safe"],
      industries: ["mining-energy", "construction"],
    },
    {
      name: "Hytera HP712Ex-IIA Intrinsically Safe Radio (ATEX/IECEx)",
      slug: "hytera-hp712ex-iia-radio",
      brand: "Hytera",
      description:
        "The Hytera HP712Ex-IIA is an ATEX / IECEx certified intrinsically safe DMR portable with a 1.47\" color display — a more compact certified option for hazardous areas.\n\nKey features\n• ATEX/IECEx: Class I Zone 1 AEx ib IIA T4 Gb\n• 1,024 channels, 64 zones\n• DMR, Analog, XPT & Tier III Trunking\n• 1.47\" color display, AI noise cancellation\n• Bluetooth 5.3, Wi-Fi 2.4GHz, NFC, GPS\n• Lone Worker & Man Down safety\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "ATEX/IECEx intrinsically safe DMR portable with 1.47\" color display and GPS/Wi-Fi.",
      specifications: [
        "Model: Hytera HP712Ex-IIA",
        "Certification: ATEX/IECEx Class I Zone 1 AEx ib IIA T4 Gb",
        "Platform: Digital (DMR), Analog, XPT & Tier III Trunking",
        "Frequency Bands: UHF 400-480 MHz / VHF 136-174 MHz",
        "Channels: 1,024 (64 Zones)",
        "Display: 1.47\" Color LCD, 172x320",
        "Battery: 2,150 mAh Li-ion, up to 22h",
        "Connectivity: Bluetooth 5.3, Wi-Fi 2.4GHz, NFC, GPS",
        "Warranty: 3 Year Standard (Radios only)",
      ].join("\n"),
      bands: [
        { label: UHF480, sku: "HP712Ex-IIA-U1", cad: 2261, stock: 7 },
        { label: VHF, sku: "HP712Ex-IIA-V1", cad: 2261, stock: 6 },
      ],
      programming: true,
      categories: ["intrinsically-safe"],
      industries: ["mining-energy"],
    },

    // ---------- REPEATERS ----------
    {
      name: "Hytera HR1062 High Performance Multimode Digital Repeater",
      slug: "hytera-hr1062-repeater",
      brand: "Hytera",
      description:
        "The Hytera HR1062 is a full-duty, high-performance rack-mount digital repeater that extends coverage across large sites. It supports IP-Connect multi-site networking, SIP telephony, and 100% continuous duty at 50W.\n\nKey features\n• 64 channels, full-duty 50W operation\n• DMR, Analog & optional XPT Trunking\n• IP-Connect, Wireless-Link over DMR, SIP\n• AC & DC power inputs with auto-switching\n• Two simultaneous voice paths in digital mode\n• AES256 encryption capable (license)\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Full-duty 50W rack-mount digital repeater with IP-Connect multi-site networking.",
      specifications: [
        "Model: Hytera HR1062",
        "Type: Full-Duty Digital Repeater (1U rack)",
        "Platform: DMR, Analog & optional XPT Trunking",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz / 806-941 MHz",
        "Channels: 64",
        "Power: 5-50W, 100% continuous duty @ 50W",
        "Networking: IP-Connect, Wireless-Link, SIP",
        "Encryption: ARC4, AES256 (license required)",
        "Warranty: 3 Year Standard",
      ].join("\n"),
      bands: [
        { label: UHF400, sku: "HR1062-U1", cad: 4932, stock: 6 },
        { label: VHF, sku: "HR1062-V1", cad: 4932, stock: 5 },
      ],
      categories: ["repeaters"],
      industries: ["security", "construction"],
    },
    {
      name: "Hytera HR652 Compact Portable Digital Repeater",
      slug: "hytera-hr652-repeater",
      brand: "Hytera",
      description:
        "The Hytera HR652 is a compact, fully-featured portable repeater that can run on an optional internal battery — ideal for rapid deployment, events, and temporary sites. Supports IP-Connect and single-frequency repeater (SFR) modes.\n\nKey features\n• 1,024 channel capacity\n• DMR, Analog & SFR modes\n• Optional 12.4Ah internal battery (up to 9h)\n• IP67 (10W) / IP54 (25W), MIL-STD-810\n• IP-Connect networking & SIP telephony\n• AES256 encryption capable (license)\n\nSelect your frequency band and programming option above.",
      shortDescription:
        "Compact portable repeater with optional battery for rapid deployment and events.",
      specifications: [
        "Model: Hytera HR652",
        "Type: Compact Portable Digital Repeater",
        "Platform: DMR, Analog & SFR modes",
        "Frequency Bands: UHF 400-470 MHz / VHF 136-174 MHz",
        "Channels: 1,024 capacity",
        "Power: 1-10W or 1-25W",
        "Battery: optional 12.4Ah Li-ion (up to 9h @ 10W)",
        "Ingress / Durability: IP67 (10W) / IP54 (25W), MIL-STD-810 C/D/E/F/G",
        "Networking: IP-Connect, SIP",
        "Warranty: 3 Year Standard",
      ].join("\n"),
      isNewArrival: true,
      bands: [
        { label: UHF400, sku: "HR652-U", cad: 3638, stock: 7 },
        { label: VHF, sku: "HR652-V", cad: 3638, stock: 6 },
      ],
      categories: ["repeaters"],
      industries: ["construction", "schools"],
    },

    // ---------- ACCESSORIES ----------
    {
      name: "Hytera SM16A1 Palm Microphone (IP54)",
      slug: "hytera-sm16a1-palm-microphone",
      brand: "Hytera",
      description:
        "The Hytera SM16A1 is an IP54-rated palm microphone for HM-series mobile radios and HR1062 repeaters, with a 10-pin Hytera connector for clear, hands-on communication.",
      shortDescription: "IP54 palm microphone for HM-series mobile radios and HR1062 repeaters.",
      specifications: [
        "Model: Hytera SM16A1",
        "Type: Palm Microphone",
        "Ingress: IP54",
        "Connector: 10-Pin Hytera",
        "Compatibility: HM682 / HM782 / HR1062",
      ].join("\n"),
      isBestSeller: true,
      priceCad: 82,
      categories: ["accessories"],
      industries: ["construction", "security"],
    },
    {
      name: "Hytera SM27W2 Bluetooth Wireless Remote Speaker Microphone (IP67)",
      slug: "hytera-sm27w2-bluetooth-rsm",
      brand: "Hytera",
      description:
        "The Hytera SM27W2 is a rugged IP67 Bluetooth wireless remote speaker microphone with a dedicated emergency button and belt clip — freeing your team from cables while keeping audio loud and clear.",
      shortDescription: "Rugged IP67 Bluetooth wireless speaker mic with emergency button.",
      specifications: [
        "Model: Hytera SM27W2",
        "Type: Bluetooth Wireless Remote Speaker Microphone",
        "Ingress: IP67",
        "Features: Emergency button, belt clip",
        "Connectivity: Bluetooth",
      ].join("\n"),
      isNewArrival: true,
      priceCad: 196,
      categories: ["accessories"],
      industries: ["security", "retail"],
    },
    {
      name: "Hytera EHW08 Bluetooth Earpiece with Boom Mic & PTT",
      slug: "hytera-ehw08-bluetooth-earpiece",
      brand: "Hytera",
      description:
        "The Hytera EHW08 is a wireless Bluetooth earpiece with a boom microphone and PTT function for discreet, hands-free communication on Bluetooth-enabled Hytera radios.",
      shortDescription: "Wireless Bluetooth earpiece with boom mic and PTT function.",
      specifications: [
        "Model: Hytera EHW08",
        "Type: Bluetooth Earpiece with Boom Mic & PTT",
        "Connectivity: Bluetooth",
        "Compatibility: Bluetooth-enabled Hytera radios",
      ].join("\n"),
      priceCad: 146,
      categories: ["accessories"],
      industries: ["healthcare", "hospitality"],
    },
    {
      name: "Hytera BP2403 Li-Po Battery Pack 2400mAh (IP68)",
      slug: "hytera-bp2403-battery",
      brand: "Hytera",
      description:
        "The Hytera BP2403 is a 2,400 mAh IP68 Li-Po battery pack for HP702 and HP782 radios, delivering up to 24 hours of operation per charge.",
      shortDescription: "2,400 mAh IP68 Li-Po battery for HP702 / HP782 radios.",
      specifications: [
        "Model: Hytera BP2403",
        "Type: Li-Po Battery Pack",
        "Capacity: 2,400 mAh, 7.7V",
        "Ingress: IP68",
        "Compatibility: HP702 / HP782",
      ].join("\n"),
      priceCad: 163,
      categories: ["accessories"],
      industries: ["construction", "security"],
    },
    {
      name: "Hytera CH10L30 Single-Unit Smart Charger",
      slug: "hytera-ch10l30-charger",
      brand: "Hytera",
      description:
        "The Hytera CH10L30 is a single-unit MCU smart charger (1A) for Li-ion and Li-Po HP-series batteries, with the PS1014 AC adapter included.",
      shortDescription: "Single-unit 1A smart charger for HP-series Li-ion / Li-Po batteries.",
      specifications: [
        "Model: Hytera CH10L30",
        "Type: Single-Unit Smart Charger",
        "Output: 12VDC / 1A",
        "Compatibility: HP-series Li-ion & Li-Po batteries",
      ].join("\n"),
      priceCad: 54,
      categories: ["accessories"],
      industries: ["retail", "schools"],
    },
  ];

  for (const productData of products) {
    const {
      categories: catSlugs,
      industries: indSlugs,
      reviews: productReviews,
      bands,
      programming,
      priceCad,
      saleCad,
      images,
      status,
      isNewArrival,
      isBestSeller,
      ...base
    } = productData;

    // Derive options, variants, and pricing.
    let options: SeedOption[] | undefined;
    let variants: SeedVariant[] | undefined;
    let hasVariants = false;
    let priceCadCents = priceCad ? cadCents(priceCad) : 0;
    let priceUsdCents = priceCad ? usdCents(priceCad) : 0;

    if (bands && bands.length) {
      hasVariants = true;
      options = [{ name: "Frequency Band", values: bands.map((b) => b.label) }];
      if (programming) options.push({ name: "Programming", values: PROGRAMMING_VALUES });

      variants = [];
      for (const band of bands) {
        const bCad = cadCents(band.cad);
        const bUsd = usdCents(band.cad);
        if (programming) {
          variants.push({ sku: `${band.sku}-DEF`, stock: band.stock ?? 20, options: [band.label, "Default Frequency"], priceCadCents: bCad, priceUsdCents: bUsd });
          variants.push({ sku: `${band.sku}-CUST`, stock: Math.max(0, (band.stock ?? 20) - 5), options: [band.label, "Custom Frequency"], priceCadCents: bCad, priceUsdCents: bUsd });
        } else {
          variants.push({ sku: band.sku, stock: band.stock ?? 20, options: [band.label], priceCadCents: bCad, priceUsdCents: bUsd });
        }
      }
      priceCadCents = cadCents(bands[0].cad);
      priceUsdCents = usdCents(bands[0].cad);
    }

    const productFields = {
      ...base,
      images: images ?? ["/placeholder-product.svg"],
      status: status ?? ("ACTIVE" as const),
      isNewArrival: isNewArrival ?? false,
      isBestSeller: isBestSeller ?? false,
      priceCadCents,
      priceUsdCents,
      saleCadCents: saleCad != null ? cadCents(saleCad) : null,
      saleUsdCents: saleCad != null ? usdCents(saleCad) : null,
      hasVariants,
    };

    const product = await prisma.product.upsert({
      where: { slug: productFields.slug },
      update: productFields,
      create: productFields,
    });

    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    await prisma.productIndustry.deleteMany({ where: { productId: product.id } });

    await prisma.productCategory.createMany({
      data: catSlugs.map((slug) => ({ productId: product.id, categoryId: categoryMap[slug] })),
    });
    await prisma.productIndustry.createMany({
      data: indSlugs.map((slug) => ({ productId: product.id, industryId: industryMap[slug] })),
    });

    await prisma.productOption.deleteMany({ where: { productId: product.id } });
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });

    if (options?.length) {
      const valueIdByName: Record<string, string> = {};
      for (const [position, option] of options.entries()) {
        const createdOption = await prisma.productOption.create({
          data: {
            productId: product.id,
            name: option.name,
            position,
            values: { create: option.values.map((value, index) => ({ value, position: index })) },
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
              options: { create: optionValueIds.map((optionValueId) => ({ optionValueId })) },
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

  // Hide any products from earlier seeds that are no longer in the catalog.
  const activeSlugs = products.map((p) => p.slug);
  await prisma.product.updateMany({
    where: { slug: { notIn: activeSlugs }, status: "ACTIVE" },
    data: { status: "DRAFT" },
  });

  const reviews = [
    { author: "Jessica Chapman", content: "Great radios at a reasonable price, and they shipped quickly! The team helped me pick the right model for our warehouse.", rating: 5, featured: true },
    { author: "Eric M.", content: "Amazing customer service! Great product and fast response. I'm a repeat customer time and time again.", rating: 5, featured: true },
    { author: "Director of Operations", content: "We have been working with this team since 2017, and they always come through with great communication solutions.", rating: 5, featured: true },
    { author: "Matt A.", content: "Bought these for my team across multiple locations. The Hytera DMR fleet has been rock solid.", rating: 5, featured: true },
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
