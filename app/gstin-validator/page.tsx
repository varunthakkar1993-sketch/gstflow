import type { Metadata } from "next";
import GstinValidator from "./GstinValidator";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /gstin-validator: verify & decode a GST number. Server Component (SEO + JSON-LD)
 * wrapping a client-side validator. Format + checksum only, no live portal lookup.
 */

export const metadata: Metadata = {
  title: "GSTIN Verification: Validate & Decode a GST Number | Paavti",
  description:
    "Free GSTIN validator and GST number verification. Check the format, state code and check digit, decode the PAN and state, and validate GST numbers in bulk.",
  keywords: [
    "gstin verification",
    "gstin validator",
    "gstin validator online",
    "gst validation",
    "gst number validation",
    "validate gstin",
    "gstin check",
    "decode gst number",
    "how to read gst number",
    "bulk gstin validator",
    "gstin format",
  ],
  alternates: { canonical: "https://paavti.com/gstin-validator" },
  openGraph: {
    title: "GSTIN Verification: Validate & Decode a GST Number | Paavti",
    description:
      "Check a GST number's format, state code and check digit, decode what it means, and validate a whole list at once. Free.",
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
    q: "How do I validate a GST number?",
    a: "Paste it into the box above. The tool checks that it is 15 characters, that the pattern matches the official GSTIN structure, that the state code is real, and that the final check digit matches the value calculated from the first 14 characters. Anything that fails one of those tests is not a genuine GSTIN.",
  },
  {
    q: "Can I validate GST numbers in bulk?",
    a: "Yes. Switch to the bulk tab and paste up to 500 GST numbers, one per line or separated by commas. You get a valid or invalid verdict for each with the state, PAN and holder type decoded, and you can download the whole result as a CSV. It runs entirely in your browser, so the list never leaves your computer.",
  },
  {
    q: "Does this tool confirm a GST number is active?",
    a: "No. This validator checks the format, the state code and the check digit, which is enough to catch typos and made-up numbers. To confirm a business is actually registered and active, look the GSTIN up on the official GST portal at services.gst.gov.in.",
  },
  {
    q: "How can I tell a fake GST number?",
    a: "A genuine GSTIN passes the check-digit test built into its 15th character. If the last character does not match the value calculated from the first 14, the number is invalid. This tool runs that calculation for you, so an altered or invented number shows up immediately.",
  },
  {
    q: "How do I read a GST number?",
    a: "Read it in five parts. Characters 1 to 2 give the state, 3 to 12 are the PAN of the business or person, character 13 says how many times that PAN has registered in that state, character 14 is almost always Z, and character 15 is the check digit. The fifth character of the PAN also tells you the holder type — P for an individual, C for a company, F for a firm or LLP, and so on.",
  },
  {
    q: "Is this GSTIN validator free?",
    a: "Yes, free with no signup and no limit, for single numbers and for bulk lists.",
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
    alternateName: "Paavti GST Number Verification Tool",
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
              Free · No login · Single or bulk
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              GSTIN Verification &amp; Validator
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Validate any GST number in seconds. We check the format, state code and check digit, and
              decode the PAN, state and holder type behind it. Paste a whole list to validate GST numbers
              in bulk.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5">
          <GstinValidator />
        </div>

        <div className="mx-auto max-w-3xl px-5">
          <section className="border-t border-slate-200 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              How to read a GST number
            </h2>
            <p className="mt-3">
              Every GST number carries meaning in its 15 characters. Decoding it tells you which state the
              business is registered in and whose PAN it belongs to, and the final digit proves the number
              was not simply made up.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li><strong>Characters 1 to 2</strong> — the state code, such as 27 for Maharashtra or 29 for Karnataka.</li>
              <li><strong>Characters 3 to 12</strong> — the 10-character PAN of the business or person.</li>
              <li><strong>Character 13</strong> — how many times that PAN has registered in the state.</li>
              <li><strong>Character 14</strong> — a default letter, normally Z.</li>
              <li><strong>Character 15</strong> — a check digit that must match the other 14, which is how fakes are caught.</li>
            </ul>
            <p className="mt-3">
              There is a sixth clue hidden inside the PAN. Its fifth character — the sixth character of the
              GSTIN overall — encodes the type of holder: P for an individual or proprietor, C for a
              company, F for a firm or LLP, H for a HUF, T for a trust, A for an association of persons,
              and G for government.
            </p>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              GSTIN example, decoded
            </h2>
            <p className="mt-3">
              Take <strong className="font-mono">27AAPFU0939F1ZV</strong>. The 27 is Maharashtra.{" "}
              <span className="font-mono">AAPFU0939F</span> is the PAN, and its fifth character F says the
              holder is a firm or LLP. The 1 means this is the first registration for that PAN in
              Maharashtra, the Z is the standard default, and the V is the check digit calculated from
              everything before it. Change any character and the V stops matching — which is exactly what
              this tool tests.
            </p>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              What the check digit actually proves
            </h2>
            <p className="mt-3">
              The 15th character is not random. It is computed from the first 14 using the official GSTN
              algorithm, a weighted sum over a 36-character alphabet. That means a GSTIN validates itself:
              a typo, a transposed pair of characters or an invented number will almost always produce a
              check digit that does not match, and this page will say so immediately.
            </p>
            <p className="mt-3">
              What it does not prove is that the registration is live. A number can be structurally perfect
              and still belong to a business whose registration has been cancelled or suspended. Structural
              validation catches the careless and the fabricated; the GST portal is what confirms current
              status.
            </p>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              Validating GST numbers in bulk
            </h2>
            <p className="mt-3">
              If you handle books for more than one business, checking suppliers one at a time is the slow
              way to find the problem. Switch to the bulk tab, paste up to 500 GST numbers, and every one
              comes back with a verdict, the state, the PAN and the holder type, ready to download as a CSV.
            </p>
            <p className="mt-3">
              This matters most before you claim input tax credit. A supplier GSTIN that fails the check
              digit was never going to reconcile, and finding that at filing time is expensive. The whole
              thing runs in your browser — your supplier list is never uploaded anywhere.
            </p>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              Why verify a GST number?
            </h2>
            <p className="mt-3">
              Before you claim input tax credit on a supplier&apos;s invoice, that supplier&apos;s GSTIN needs to be
              genuine. A quick format and check-digit test catches typos and invented numbers instantly. For
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

          <section className="border-t border-slate-200 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">Other free tools</h2>
            <p className="mt-3">
              Paavti has a set of free tools for Indian freelancers and small businesses, all usable without
              an account:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li><a className="text-[#2563eb] underline" href="/gst-invoice-generator">GST invoice generator</a> — a compliant tax invoice with CGST/SGST/IGST split</li>
              <li><a className="text-[#2563eb] underline" href="/quotation-generator">Online quotation maker</a> — quotes and estimates with GST and validity</li>
              <li><a className="text-[#2563eb] underline" href="/payment-receipt-generator">Payment receipt generator</a> — UPI, bank transfer, cash and cheque receipts</li>
              <li><a className="text-[#2563eb] underline" href="/gst-rate-finder">GST rate finder</a> — HSN and SAC lookup with current rates</li>
              <li><a className="text-[#2563eb] underline" href="/gst-calculator">GST calculator</a> — add or remove GST from any amount</li>
            </ul>
          </section>
        </div>

        <div className="mx-auto max-w-6xl px-5">
          <div className="my-9 rounded-2xl bg-[#0f1f5c] px-5 py-11 text-center text-white">
            <h2 className="text-2xl font-bold">Billing a GST-registered client?</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Create a compliant GST invoice with your client&apos;s GSTIN and the right tax split, free and in
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
