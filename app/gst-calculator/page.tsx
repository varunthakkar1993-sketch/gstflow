import type { Metadata } from "next";
import GstCalculator from "./GstCalculator";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /gst-calculator — free GST calculator (add/remove GST, CGST/SGST/IGST).
 * Server Component with metadata + JSON-LD; the calculator is a client component.
 */

export const metadata: Metadata = {
  title: "GST Calculator — Free Online GST Calculator India | Paavti",
  description:
    "Free online GST calculator. Add or remove GST instantly with automatic CGST, SGST and IGST split for 5%, 12%, 18% and 28% slabs. No signup needed.",
  keywords: [
    "gst calculator",
    "gst calculator online",
    "reverse gst calculator",
    "how to calculate gst",
    "gst calculation",
  ],
  alternates: { canonical: "https://paavti.com/gst-calculator" },
  openGraph: {
    title: "Free GST Calculator (Online) | Paavti",
    description:
      "Add or remove GST instantly with CGST/SGST/IGST split. Free, no signup.",
    url: "https://paavti.com/gst-calculator",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
};

const faqs = [
  {
    q: "How do I calculate GST on an amount?",
    a: "To add GST, multiply the amount by the GST rate and add it to the amount — e.g. ₹10,000 at 18% GST = ₹1,800 GST, total ₹11,800. The calculator above does this instantly and splits it into CGST and SGST, or IGST for a different state.",
  },
  {
    q: "What is a reverse GST calculation?",
    a: "Reverse GST (or 'remove GST') works out the original pre-tax price from a GST-inclusive amount. Switch the calculator to 'Remove GST' and it extracts the base amount and the GST included.",
  },
  {
    q: "What is the difference between CGST, SGST and IGST?",
    a: "For a sale within the same state, GST is split equally into CGST (central) and SGST (state). For a sale to a different state, the full rate is charged as IGST (integrated). The calculator switches automatically based on the transaction type you pick.",
  },
  {
    q: "What are the GST rates in India?",
    a: "The main GST slabs are 5%, 12%, 18% and 28%, with 3% applying to items like gold. Most services fall under 18%.",
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
    name: "Paavti GST Calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: "https://paavti.com/gst-calculator",
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
              Free · No signup
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              GST Calculator
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Add or remove GST in one tap, with an automatic CGST / SGST / IGST
              split. Works for the 5%, 12%, 18% and 28% slabs — built for Indian
              freelancers &amp; small businesses.
            </p>
          </div>
        </section>

        {/* TOOL */}
        <div className="mx-auto max-w-6xl px-5">
          <GstCalculator />
        </div>

        {/* SEO CONTENT */}
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              How to calculate GST
            </h2>
            <p className="mt-3">
              GST is calculated as a percentage of the taxable value. To
              <b> add GST</b>, multiply the amount by the rate and add it on top.
              To <b>remove GST</b> from a price that already includes it, divide
              the total by (1 + rate). For example, on ₹10,000 at 18%:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Add GST: ₹10,000 + 18% = <b>₹11,800</b> (₹1,800 GST)</li>
              <li>Remove GST from ₹11,800: base <b>₹10,000</b>, GST ₹1,800</li>
              <li>Same state: ₹900 CGST + ₹900 SGST · Other state: ₹1,800 IGST</li>
            </ul>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              GST rates in India
            </h2>
            <p className="mt-3">
              Most goods and services fall into one of four slabs. Services are
              usually taxed at 18%.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><b>5%</b> — essentials, small restaurants, transport</li>
              <li><b>12%</b> — processed food, business-class travel, some electronics</li>
              <li><b>18%</b> — most services, software, professional fees</li>
              <li><b>28%</b> — luxury goods, cars, tobacco</li>
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
            <h2 className="text-2xl font-bold">Need a GST invoice, not just the maths?</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Create a GST-compliant invoice with this tax auto-filled, a UPI QR
              code and instant PDF — free.
            </p>
            <a href="/gst-invoice-generator"
              className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#2563eb] hover:bg-slate-100">
              Make a free GST invoice →
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
