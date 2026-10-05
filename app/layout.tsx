import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paavti | Free UPI Receipt, Quotation & GST Invoice Maker",
  description: "Make UPI payment receipts, quotations and GST invoices in seconds. Free to start, no login needed. Built for Indian freelancers and small businesses.",
  keywords: [
    "GST invoice generator India",
    "free GST invoice maker",
    "GST billing software freelancers",
    "UPI invoice generator",
    "free invoicing software India",
    "GST compliant invoice",
    "small business billing India",
    "online invoice maker India",
    "quote generator India",
    "expense tracker India"
  ],
  authors: [{ name: "Paavti" }],
  creator: "Paavti",
  publisher: "Paavti",
  metadataBase: new URL("https://paavti.com"),
  verification: {
    google: "qFwG6GJZPzzEcfip58UTruKrG-iXB4IrwAal3S3P4rY",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Paavti | Free UPI Receipt, Quotation & GST Invoice Maker",
    description: "Make UPI payment receipts, quotations and GST invoices in seconds. Free to start, no login needed.",
    url: "https://paavti.com",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paavti | Free UPI Receipt, Quotation & GST Invoice Maker",
    description: "Make UPI payment receipts, quotations and GST invoices in seconds. Free to start, no login needed.",
    creator: "@paavti",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
