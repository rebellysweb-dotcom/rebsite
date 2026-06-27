import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import EventBanner from "@/components/EventBanner";
import ScrollAnimations from "@/components/ScrollAnimations";
import FloatingPetals from "@/components/FloatingPetals";
import { JsonLd } from "@/components/JsonLd";
import { getLocalBusinessSchema } from "@/lib/structured-data";
import PostHogProvider from "@/components/PostHogProvider";

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
    template: "%s | Rebelly's Flower Shop",
    default: "Rebelly's Flower Shop | Florist in Zalka, Lebanon",
  },
  description:
    "Order fresh bouquets, floral gift boxes, wedding flowers, and event arrangements from Rebelly's Flower Shop on Saydeh Street in Zalka, Lebanon. Delivery across nearby Metn areas.",
  keywords: [
    "flower shop Lebanon", "florist Zalka", "bouquets Beirut", "floral arrangements",
    "wedding flowers Lebanon", "gift flowers", "Rebellys", "محل زهور لبنان",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Rebelly's Flower Shop | Florist in Zalka, Lebanon",
    description:
      "Order fresh bouquets, floral gift boxes, wedding flowers, and event arrangements from Rebelly's Flower Shop on Saydeh Street in Zalka, Lebanon.",
    url: "https://rebellys.com",
    siteName: "Rebelly's Flower Shop",
    images: [
      {
        url: "/images/shop_interior.png",
        width: 1200,
        height: 630,
        alt: "Rebelly's Flower Shop Interior",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rebelly's Flower Shop | Florist in Zalka, Lebanon",
    description:
      "Order fresh bouquets, floral gift boxes, wedding flowers, and event arrangements from Rebelly's Flower Shop on Saydeh Street in Zalka, Lebanon.",
    images: ["/images/shop_interior.png"],
  },
  alternates: {
    canonical: "https://rebellys.com",
    languages: {
      "en": "https://rebellys.com",
      "x-default": "https://rebellys.com",
    },
  },
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
        <meta name="geo.region" content="LB" />
        <meta name="geo.placename" content="Zalka" />
        <meta name="geo.position" content="33.904;35.580" />
        <meta name="ICBM" content="33.904, 35.580" />
        {/* hreflang for international bots */}
        <link rel="alternate" hrefLang="en" href="https://rebellys.com" />
        <link rel="alternate" hrefLang="x-default" href="https://rebellys.com" />
      </head>
      <body>
        <JsonLd data={getLocalBusinessSchema()} />
        <PostHogProvider>
          <ScrollAnimations />
          <FloatingPetals />
          <div className="page-shell">
            <EventBanner />
            <Navbar />
            <main>{children}</main>
            <Footer />
          </div>
          <CartDrawer />
        </PostHogProvider>
      </body>
    </html>
  );
}
