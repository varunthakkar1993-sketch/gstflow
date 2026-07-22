import type { Metadata } from "next";
import RentReceiptGenerator from "./RentReceiptGenerator";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /rent-receipt-generator: free rent receipt generator for HRA claims.
 * Server Component (SEO + JSON-LD) wrapping a client-side tool.
 */

export const metadata: Metadata = {
  title: "Free Rent Receipt Generator for HRA (Online) | Paavti",
  description:
    "Generate rent receipts online free for your HRA claim: one receipt per month, with amount in words and landlord PAN. Download all months as a PDF. No signup.",
  keywords: [
    "rent receipt generator",
    "rent receipt for hra",
    "free rent receipt",
    "rent receipt format",
    "rent receipt online",
  ],
  alternates: { canonical: "https://paavti.com/rent-receipt-generator" },
  openGraph: {
    title: "Free Rent Receipt Generator for HRA | Paavti",
    description:
      "Generate a year of rent receipts for your HRA claim in one click. Free, no signup.",
    url: "https://paavti.com/rent-receipt-generator",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
};

const faqs = [
  {
    q: "How do I generate rent receipts for HRA?",
    a: "Enter your name (the tenant), your landlord's name, the monthly rent, the rented address, and the period you need, for example April 2025 to March 2026. The tool creates one receipt per month and downloads them all as a single PDF, ready to submit for your HRA claim.",
  },
  {
    q: "Is a landlord's PAN required on a rent receipt?",
    a: "If your total rent for the year is more than ₹1,00,000, your employer usually needs your landlord's PAN to allow the HRA exemption. There is an optional field for it above.",
  },
  {
    q: "Is a revenue stamp needed on a rent receipt?",
    a: "A revenue stamp is generally required only when rent is paid in cash and a single receipt exceeds ₹5,000. Payments by UPI, bank transfer or cheque don't need a stamp because there's already a payment trail.",
  },
  {
    q: "Is this rent receipt generator free?",
    a: "Yes, you can generate and download rent receipts for free, with no signup and no watermark.",
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
    name: "Paavti Rent Receipt Generator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: "https://paavti.com/rent-receipt-generator",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };

  return (
    <>
      <SiteHeader />
      <main className="text-[#0f1f5c]">
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />

        {/* HERO */}
        <section className="bg-gradient-to-b from-[#eff4ff] to-white">
          <div className="mx-auto max-w-6xl px-5 pt-12 pb-6 text-center">
            <span className="inline-block rounded-full bg-[#e0eaff] px-3.5 py-1.5 text-[13px] font-semibold text-[#1d4ed8]">
              Free · No signup · For HRA claims
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Rent Receipt Generator
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Generate a full year of rent receipts for your HRA claim in one
              click: one receipt per month, with amount in words and landlord
              PAN, downloaded as a single PDF.
            </p>
          </div>
        </section>

        {/* TOOL */}
        <div className="mx-auto max-w-6xl px-5">
          <RentReceiptGenerator />
        </div>

        {/* SEO CONTENT */}
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              How to make rent receipts for your HRA claim
            </h2>
            <p className="mt-3">
              To claim House Rent Allowance (HRA) exemption, salaried employees
              usually need to submit rent receipts to their employer. Fill in the
              tenant and landlord details, the monthly rent and the period you
              want, and the tool builds one receipt for every month, then hands
              you a single PDF to download and submit.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-6">
              <li>Enter tenant, landlord and property details</li>
              <li>Set the monthly rent and add landlord PAN if rent &gt; ₹1L/year</li>
              <li>Pick the period (e.g. April to March for a financial year)</li>
              <li>Download all monthly receipts as one PDF</li>
            </ol>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              What a valid rent receipt should include
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Tenant name and the amount paid (in figures and words)</li>
              <li>The month the rent is for</li>
              <li>Address of the rented property</li>
              <li>Landlord name, signature and PAN (if annual rent &gt; ₹1,00,000)</li>
              <li>Payment mode, plus a revenue stamp for cash payments over ₹5,000</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Frequently asked questions
            </h2>
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

        {/* CTA */}
        <div className="mx-auto max-w-6xl px-5">
          <div className="my-9 rounded-2xl bg-[#0f1f5c] px-5 py-11 text-center text-white">
            <h2 className="text-2xl font-bold">Freelancer or business? Send GST invoices too</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Paavti also creates GST-compliant invoices with a UPI QR code and
              instant PDF, free to start.
            </p>
            <a href="/gst-invoice-generator"
              className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#2563eb] hover:bg-slate-100">
              Try the GST invoice generator →
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
