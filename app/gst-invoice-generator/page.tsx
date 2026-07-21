import type { Metadata } from "next";
import InvoiceGenerator from "./InvoiceGenerator";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /gst-invoice-generator  — upgraded from a text-only SEO page into a page with
 * a live, interactive invoice generator on top of the existing indexed copy.
 *
 * Server Component: headings, copy and FAQ are server-rendered for Google.
 * The tool (<InvoiceGenerator />) is a Client Component and never hits Firestore,
 * so anonymous PDF downloads are free and unlimited (the 5/month limit is an
 * account feature, applied after /signup).
 *
 * Brand colors inline: navy #0f1f5c · blue #2563eb · blue-dark #1d4ed8 · light #eff4ff
 */

export const metadata: Metadata = {
  title: "Free GST Invoice Generator Online | Paavti",
  description:
    "Create GST-compliant invoices free in minutes. Auto CGST/SGST/IGST split, HSN codes, UPI QR code and instant PDF download. No signup needed to start.",
  keywords: [
    "gst invoice generator",
    "free gst invoice generator",
    "gst bill generator",
    "invoice generator india",
    "create gst invoice online",
  ],
  alternates: { canonical: "https://paavti.com/gst-invoice-generator" },
  openGraph: {
    title: "Free GST Invoice Generator Online | Paavti",
    description:
      "Create a GST-compliant invoice in under a minute — free, no signup to start.",
    url: "https://paavti.com/gst-invoice-generator",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
};

const faqs = [
  {
    q: "Is this GST invoice generator really free?",
    a: "Yes. You can create and download GST invoices for free with no watermark, and you do not need an account to start. A free Paavti account adds saving, payment tracking and one-click sending, and includes 5 invoices per month. Upgrade any time for unlimited.",
  },
  {
    q: "GST invoice kaise banaye?",
    a: "Apna business name aur GSTIN daaliye, client ki details add kariye, items ko HSN code ke saath likhiye, aur tool CGST aur SGST khud calculate karke ek ready PDF bana dega.",
  },
  {
    q: "Does it calculate CGST, SGST and IGST automatically?",
    a: "Yes. Based on your state and your client's state, it applies CGST and SGST when both are in the same state, or IGST when they are in different states.",
  },
  {
    q: "Can I add a UPI QR code to the invoice?",
    a: "Yes. Add your UPI ID and the invoice shows a payment QR so clients can pay you faster.",
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
    name: "Paavti GST Invoice Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://paavti.com/gst-invoice-generator",
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
            Free to use · No signup to start
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Free GST Invoice Generator
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Make a GST-ready invoice in under two minutes. Automatic CGST / SGST /
            IGST, HSN codes, UPI QR code and instant PDF download — built for
            Indian freelancers &amp; small businesses.
          </p>
        </div>
      </section>

      {/* THE TOOL */}
      <div className="mx-auto max-w-6xl px-5">
        <InvoiceGenerator />
      </div>

      {/* SEO CONTENT (kept + refreshed from the original indexed page) */}
      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
          <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
            How to make a GST invoice for free
          </h2>
          <p className="mt-3">
            To make a free GST invoice, enter your business name and GSTIN, add
            your client&apos;s details, list each item with its HSN code and rate,
            and let the tool split CGST, SGST or IGST automatically. Review the
            total and download the PDF. No account needed to start.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-6">
            <li>Add your business details and GSTIN</li>
            <li>Add your client and their state</li>
            <li>Enter items with HSN codes and tax rate</li>
            <li>Download the GST invoice as a PDF</li>
          </ol>

          <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
            A free GST invoice format built for freelancers, not accountants
          </h2>
          <p className="mt-3">
            Most invoicing tools are built for accounting teams. Tally assumes you
            know debits and credits. Zoho gives you fifty features when you need
            three. Paavti does the opposite. It gives a freelancer or solo
            business the three things that actually matter: a correct GST invoice,
            a clean PDF, and a fast way to get paid. No setup, no accounting
            jargon, no learning curve.
          </p>

          <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
            Add your UPI details and get paid faster
          </h2>
          <p className="mt-3">
            Add your UPI ID or QR code to the invoice so your client can pay the
            moment they open it. No chasing, no separate payment message. The
            invoice carries the amount and the way to pay it in one place.
          </p>

          <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
            What a valid GST invoice needs
          </h2>
          <p className="mt-3">
            A GST invoice is only valid if it carries the right details. Paavti
            fills these in for you so nothing gets missed:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Your GSTIN and business name</li>
            <li>A unique invoice number and date</li>
            <li>Client name, address and state</li>
            <li>HSN or SAC code for each item</li>
            <li>Taxable value and the correct CGST and SGST, or IGST for a different state</li>
            <li>Place of supply</li>
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
                  <span className="hidden text-xl text-[#2563eb] group-open:inline">–</span>
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
          <h2 className="text-2xl font-bold">Save, track &amp; send your invoices</h2>
          <p className="mx-auto mt-2 max-w-xl opacity-90">
            Create a free account — <b>5 invoices every month</b>, client saving,
            payment tracking and WhatsApp send included. Upgrade for unlimited any
            time.
          </p>
          <a href="/signup"
            className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#2563eb] hover:bg-slate-100">
            Create your free account
          </a>
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
