import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import EventBanner from "@/components/EventBanner";
import ScrollAnimations from "@/components/ScrollAnimations";
import { JsonLd } from "@/components/JsonLd";
import { getLocalBusinessSchema } from "@/lib/structured-data";
import PostHogProvider from "@/components/PostHogProvider";
import StoreOnly from "@/components/StoreOnly";
import FloatingPetalsLazy from "@/components/FloatingPetalsLazy";


const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--ff-display",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--ff-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--ff-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rebellys.com"),
  title: {
    template: "%s | Rebelly's, A Flower Story",
    default: "Rebelly's | Wedding and Event Flowers, Zalka, Lebanon",
  },
  description:
    "Rebelly's has been arranging flowers since 1993, from its shop on Saydeh Street in Zalka. Wedding and event decoration, bridal bouquets, hotels, homes, vases and hand bouquets, plus same-day delivery across the Metn.",
  keywords: [
    "flower shop Lebanon", "florist Zalka", "florist Metn", "florist Antelias",
    "bouquets Beirut", "Christmas flowers Lebanon", "New Born flowers Lebanon",
    "wedding flowers Lebanon", "event decoration Lebanon", "bridal bouquet Lebanon", "hotel flowers Lebanon", "flower delivery Zalka", "gift flowers Lebanon",
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
    title: "Rebelly's | A Flower Story, Zalka, Lebanon",
    description:
      "Floral decoration for weddings and events, bridal bouquets and hand bouquets, arranged in Zalka since 1993.",
    url: "https://rebellys.com",
    siteName: "Rebelly's Flower Shop",
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "A red and white rose arrangement from Rebelly's Flower Shop, Zalka",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rebelly's Flower Shop | Zalka, Lebanon",
    description:
      "Wedding and event flowers, bridal bouquets and hand bouquets from Zalka, since 1993.",
    images: ["/images/og.jpg"],
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
      className={`${playfair.variable} ${cormorant.variable} ${inter.variable}`}
    >
      <head>
        {/* GEO meta tags — invisible to users, visible to bots */}
        <meta name="geo.region" content="LB-JL" />
        <meta name="geo.placename" content="Zalka, Mount Lebanon, Lebanon" />
        <meta name="geo.position" content="33.9040;35.5800" />
        <meta name="ICBM" content="33.9040, 35.5800" />
        <meta name="DC.title" content="Rebelly's Flower Shop" />
        <meta name="DC.description" content="Floral decoration, bouquets and gift arrangements in Zalka, Lebanon, since 1993" />
        <meta name="DC.subject" content="flowers, florist, Zalka, Lebanon, bouquets, weddings, events" />
        <meta name="DC.language" content="en" />
        {/* Scroll-reveal content must stay visible when scripting is off */}
        <noscript>
          <style>{`[data-animate],[data-animate] .stagger-item{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <JsonLd data={getLocalBusinessSchema()} />
        <PostHogProvider>
          <ScrollAnimations />
          <StoreOnly><FloatingPetalsLazy /></StoreOnly>
          <div className="page-shell">
            <StoreOnly>
              <EventBanner />
              <Navbar />
            </StoreOnly>
            <main>{children}</main>
            <StoreOnly><Footer /></StoreOnly>
          </div>
          <StoreOnly><CartDrawer /></StoreOnly>
        </PostHogProvider>
      </body>
    </html>
  );
}
