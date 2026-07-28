import type { Metadata } from "next";
import GstinValidator from "./GstinValidator";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /gstin-validator: verify & decode a GST number. Server Component (SEO + JSON-LD)
 * wrapping a client-side validator. Format + checksum only, no live portal lookup.
 */

export const metadata: Metadata = {
  title: "GSTIN Validator: Verify & Decode a GST Number | Paavti",
  description:
    "Free GSTIN validator. Check any GST number's format, state code and checksum, and see the PAN, state and holder type it belongs to. No signup.",
  keywords: [
    "gstin validator",
    "verify gst number",
    "check gst number",
    "gstin format",
    "gst number verification",
  ],
  alternates: { canonical: "https://paavti.com/gstin-validator" },
  openGraph: {
    title: "GSTIN Validator: Verify & Decode a GST Number | Paavti",
    description: "Check a GST number's format, state code and checksum, and decode what it means. Free.",
    url: "https://paavti.com/gstin-validator",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
};

const faqs = [
  {
    q: "What is a GSTIN?",
    a: "A GSTIN, or Goods and Services Tax Identification Number, is a unique 15-character number given to every business registered under GST in India. It is built from the state code, the business PAN, a registration count, a default letter and a final check digit.",
  },
  {
    q: "What is the format of a GSTIN?",
    a: "The 15 characters break down as: the first 2 digits are the state code, the next 10 are the holder's PAN, the 13th is the registration number for that PAN in the state, the 14th is a default 'Z', and the 15th is a checksum. For example, in 27AAPFU0939F1ZV, 27 is Maharashtra and AAPFU0939F is the PAN.",
  },
  {
    q: "Does this tool confirm a GST number is active?",
    a: "No. This validator checks the format, the state code and the check digit, which is enough to catch typos and made-up numbers. To confirm a business is actually registered and active, look the GSTIN up on the official GST portal at services.gst.gov.in.",
  },
  {
    q: "How can I tell a fake GST number?",
    a: "A genuine GSTIN passes the check-digit test built into its 15th character. If the last character does not match the value calculated from the first 14, the number is invalid. This tool runs that calculation for you, so an altered or invented number shows up immediately.",
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
    name: "Paavti GSTIN Validator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://paavti.com/gstin-validator",
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
              Free to use · No signup
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              GSTIN Validator
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Check any GST number in seconds. We verify the format, state code and checksum, and decode
              the PAN, state and holder type behind it.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-5">
          <GstinValidator />
        </div>

        <div className="mx-auto max-w-3xl px-5">
          <section className="border-t border-slate-200 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">How a GSTIN is built</h2>
            <p className="mt-3">
              Every GST number carries meaning in its 15 characters. Reading it tells you which state the
              business is registered in and whose PAN it belongs to, and the final digit proves the number
              was not simply made up.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Characters 1 to 2</strong>: the state code, such as 27 for Maharashtra or 29 for Karnataka.</li>
              <li><strong>Characters 3 to 12</strong>: the 10-character PAN of the business or person.</li>
              <li><strong>Character 13</strong>: how many times that PAN has registered in the state.</li>
              <li><strong>Character 14</strong>: a default letter, normally Z.</li>
              <li><strong>Character 15</strong>: a checksum that must match the other 14, which is how fakes are caught.</li>
            </ul>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">Why verify a GST number?</h2>
            <p className="mt-3">
              Before you claim input tax credit on a supplier's invoice, that supplier's GSTIN needs to be
              genuine. A quick format and checksum check catches typos and invented numbers instantly. For
              full confidence that a business is registered and active, follow up with a lookup on the
              official GST portal.
            </p>
          </section>

          <section className="border-t border-slate-200 py-12">
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
          </section>
        </div>

        <div className="mx-auto max-w-6xl px-5">
          <div className="my-9 rounded-2xl bg-[#0f1f5c] px-5 py-11 text-center text-white">
            <h2 className="text-2xl font-bold">Billing a GST-registered client?</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Create a compliant GST invoice with your client's GSTIN and the right tax split, free and in
              under a minute.
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
