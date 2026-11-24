import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import EventBanner from "@/components/EventBanner";
import ScrollAnimations from "@/components/ScrollAnimations";
import FloralCanvas from "@/components/FloralCanvas";
import { JsonLd } from "@/components/JsonLd";
import { getLocalBusinessSchema } from "@/lib/structured-data";
import PostHogProvider from "@/components/PostHogProvider";
import WhatsAppButton from '@/components/WhatsAppButton';

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--ff-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--ff-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rebellys.com"),
  title: {
    template: "%s | Rebelly's Florist — Zalka, Lebanon",
    default: "Rebelly's Flower Shop | Fresh Flowers & Gifts in Zalka, Lebanon",
  },
  description:
    "Rebelly's has been arranging flowers in Zalka since 1990. Fresh bouquets, Christmas gifting, New Born flowers, wedding arrangements, and same-day delivery across the Metn region. Order by WhatsApp.",
  keywords: [
    "flower shop Lebanon", "florist Zalka", "florist Metn", "florist Antelias",
    "bouquets Beirut", "Christmas flowers Lebanon", "New Born flowers Lebanon",
    "wedding flowers Lebanon", "flower delivery Zalka", "gift flowers Lebanon",
    "محل زهور لبنان", "ورود زلقا", "باقات ورد لبنان",
    "Rebellys flowers", "Rebellys florist", "Zalka flowers",
    "Same day flower delivery Lebanon", "Metn flower shop",
  ],
  applicationName: "Rebelly's Flower Shop",
  category: "florist",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    title: "Rebelly's Flower Shop | Fresh Flowers in Zalka, Lebanon",
    description:
      "Fresh bouquets, Christmas gifting, New Born gifts, and wedding flowers from Zalka's most trusted florist since 1990. Same-day delivery across the Metn.",
    url: "https://rebellys.com",
    siteName: "Rebelly's Flower Shop",
    images: [
      {
        url: "/images/shop_interior.png",
        width: 1200,
        height: 630,
        alt: "Rebelly's Flower Shop in Zalka, Lebanon",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rebelly's Flower Shop | Zalka, Lebanon",
    description:
      "Fresh bouquets, Christmas gifting, wedding flowers. Same-day delivery across the Metn. Order by WhatsApp.",
    images: ["/images/shop_interior.png"],
  },
  alternates: {
    canonical: "https://rebellys.com",
    // Site content is English only, so no "ar" alternate: pointing ar at the English page is a wrong hreflang signal.
    languages: {
      en: "https://rebellys.com",
      "x-default": "https://rebellys.com",
    },
  },
  // Google site verification omitted: the placeholder token was not a real verification code.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${manrope.variable}`}
    >
      <head>
        {/* GEO meta tags — invisible to users, visible to bots */}
        <meta name="geo.region" content="LB-JL" />
        <meta name="geo.placename" content="Zalka, Mount Lebanon, Lebanon" />
        <meta name="geo.position" content="33.9040;35.5800" />
        <meta name="ICBM" content="33.9040, 35.5800" />
        <meta name="DC.title" content="Rebelly's Flower Shop" />
        <meta name="DC.description" content="Fresh flowers and gift arrangements in Zalka, Lebanon since 1990" />
        <meta name="DC.subject" content="flowers, florist, Zalka, Lebanon, bouquets" />
        <meta name="DC.language" content="en" />
        {/* hreflang is emitted from metadata.alternates above (en + x-default only) */}
        {/* Scroll-reveal content must stay visible when scripting is off */}
        <noscript>
          <style>{`[data-animate],[data-animate] .stagger-item{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <JsonLd data={getLocalBusinessSchema()} />
        <PostHogProvider>
          <ScrollAnimations />
          <FloralCanvas />
          <div className="page-shell">
            <EventBanner />
            <Navbar />
            <main>{children}</main>
            <Footer />
          </div>
          <CartDrawer />
          <WhatsAppButton />
        </PostHogProvider>
      </body>
    </html>
  );
}
