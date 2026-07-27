import type { Metadata } from "next";
import GstRateFinder from "./GstRateFinder";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /gst-rate-finder: GST rate & HSN lookup targeting "gst rate finder", "gst rate for X",
 * "hsn code list". Server Component (SEO + JSON-LD) wrapping a client-side searchable table.
 */

export const metadata: Metadata = {
  title: "GST Rate Finder & HSN Code Lookup (2026) | Paavti",
  description:
    "Find the current GST rate and HSN or SAC code for any product or service. Updated for the GST 2.0 slabs of 0%, 5%, 18% and 40%. Free and fast.",
  keywords: [
    "gst rate finder",
    "hsn code finder",
    "gst rate list",
    "hsn code list with gst rate",
    "gst rate for",
  ],
  alternates: { canonical: "https://paavti.com/gst-rate-finder" },
  openGraph: {
    title: "GST Rate Finder & HSN Code Lookup (2026) | Paavti",
    description: "Find the GST rate and HSN code for any product or service. Updated for GST 2.0.",
    url: "https://paavti.com/gst-rate-finder",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
};

const faqs = [
  {
    q: "What are the current GST rates in India?",
    a: "Since the GST 2.0 reform effective 22 September 2025, most goods and services fall into four slabs: 0% for essentials, 5% for daily-use items, 18% as the standard rate, and 40% for sin and luxury goods. A special 3% rate applies to gold and silver, and 1.5% to cut and polished diamonds.",
  },
  {
    q: "What is an HSN code?",
    a: "HSN stands for Harmonised System of Nomenclature. It is a globally used code that classifies goods so the correct GST rate can be applied. Services use a similar code called the SAC, or Services Accounting Code. Every GST invoice must show the HSN or SAC code for each item.",
  },
  {
    q: "How many digits of HSN code do I need?",
    a: "If your annual turnover is above ₹5 crore you need a 6-digit HSN code. Up to ₹5 crore, a 4-digit code is required on B2B invoices and is generally optional for B2C. The right HSN code determines the GST rate, so it is worth getting it correct.",
  },
  {
    q: "Are these GST rates official?",
    a: "The rates here are indicative and reflect the GST 2.0 structure. Rates can vary by the exact product, brand and price, so always confirm the notified rate on the official CBIC GST rate finder before filing your returns.",
  },
];

export default function Page() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Paavti GST Rate Finder",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://paavti.com/gst-rate-finder",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };

  return (
    <>
      <SiteHeader />
      <main className="text-[#0f1f5c]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />

        <section className="bg-gradient-to-b from-[#eff4ff] to-white">
          <div className="mx-auto max-w-6xl px-5 pt-12 pb-6 text-center">
            <span className="inline-block rounded-full bg-[#e0eaff] px-3.5 py-1.5 text-[13px] font-semibold text-[#1d4ed8]">
              Updated for GST 2.0 · 0% · 5% · 18% · 40%
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              GST Rate Finder &amp; HSN Lookup
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Find the current GST rate and HSN or SAC code for any common product or service.
              Search below, then create a GST invoice with the right rate in one click.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-5">
          <GstRateFinder />
        </div>

        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">The GST slabs after GST 2.0</h2>
            <p className="mt-3">
              From 22 September 2025 the GST structure was simplified into four main slabs. Knowing which
              slab your product sits in is the first step to raising a correct invoice.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>0%</strong>: essentials like fresh food, unbranded grains, books, and individual health and life insurance.</li>
              <li><strong>5%</strong>: daily-use goods like packaged staples, soap, medicines, and clothing or footwear up to ₹2,500.</li>
              <li><strong>18%</strong>: the standard rate for most goods and services, from electronics and furniture to professional and IT services.</li>
              <li><strong>40%</strong>: sin and luxury goods such as aerated drinks, pan masala, luxury cars, and betting.</li>
            </ul>
            <p className="mt-3">
              Gold and silver jewellery carry a special 3% rate, and cut and polished diamonds 1.5%.
            </p>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">HSN vs SAC codes</h2>
            <p className="mt-3">
              Goods are classified with an HSN code and services with a SAC code. Both must appear on a GST
              invoice against each line item. The number of digits you need depends on your turnover: 6
              digits above ₹5 crore, and 4 digits up to ₹5 crore for B2B supplies.
            </p>
          </div>
        </section>

        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Frequently asked questions</h2>
            <div className="mt-5 space-y-2.5">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-xl border border-slate-200 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                    {f.q}
                    <span className="text-xl text-[#2563eb] group-open:hidden">+</span>
                    <span className="hidden text-xl text-[#2563eb] group-open:inline">−</span>
                  </summary>
                  <p className="mt-2.5 text-slate-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5">
          <div className="my-9 rounded-2xl bg-[#0f1f5c] px-5 py-11 text-center text-white">
            <h2 className="text-2xl font-bold">Found your rate? Make the invoice</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Create a fully compliant GST invoice with the right rate and HSN code built in. Free, no
              watermark, no signup to start.
            </p>
            <a href="/gst-invoice-generator" className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#2563eb] hover:bg-slate-100">
              Open the free invoice generator
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
