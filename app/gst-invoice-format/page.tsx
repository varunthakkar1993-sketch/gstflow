import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /gst-invoice-format: informational page targeting "gst invoice format" and
 * related queries. Pure Server Component (all content server-rendered for SEO).
 * CTA drives users into the live /gst-invoice-generator tool.
 */

export const metadata: Metadata = {
  title: "GST Invoice Format: Rules, Mandatory Fields & Free Example | Paavti",
  description:
    "The correct GST invoice format under Indian law. See every mandatory field under Rule 46, a clean example invoice, HSN code rules, and make your own free.",
  keywords: [
    "gst invoice format",
    "invoice format",
    "tax invoice format",
    "gst bill format",
    "gst invoice format in india",
  ],
  alternates: { canonical: "https://paavti.com/gst-invoice-format" },
  openGraph: {
    title: "GST Invoice Format: Rules, Mandatory Fields & Free Example | Paavti",
    description:
      "Every mandatory field on a GST invoice under Rule 46, with a clean example. Make yours free in under a minute.",
    url: "https://paavti.com/gst-invoice-format",
    siteName: "Paavti",
    locale: "en_IN",
    type: "article",
  },
};

const fields = [
  { t: "Supplier details", d: "Your legal business name, address and GSTIN." },
  { t: "Invoice number & date", d: "A consecutive, unique serial number (max 16 characters) and the date of issue." },
  { t: "Recipient details", d: "The buyer's name, address and GSTIN or UIN if they are registered." },
  { t: "Description of goods or services", d: "A clear line-by-line description of what you are billing for." },
  { t: "HSN or SAC code", d: "The HSN code for goods or SAC code for services against each item." },
  { t: "Quantity & unit", d: "Quantity supplied and the unit quantity code (UQC) for goods." },
  { t: "Taxable value", d: "The value of each item after any discount, before tax." },
  { t: "Tax rate & amount", d: "The rate and amount of CGST, SGST or UTGST, IGST, and cess where it applies." },
  { t: "Place of supply", d: "The place of supply and state, mandatory for inter-state (IGST) invoices." },
  { t: "Reverse charge", d: "A clear statement of whether tax is payable on a reverse charge basis." },
  { t: "Delivery address", d: "The shipping address where it is different from the billing address." },
  { t: "Signature", d: "The signature or digital signature of the supplier or an authorised person." },
];

const faqs = [
  {
    q: "What is the correct format for a GST invoice?",
    a: "A GST invoice must carry your business name, address and GSTIN, a unique invoice number and date, the buyer's details, a description of each item with its HSN or SAC code, quantity, taxable value, the applicable GST rate and amount, the place of supply, and your signature. Rule 46 of the CGST Rules lists these mandatory fields. The example on this page shows them laid out correctly.",
  },
  {
    q: "Is there a difference between a tax invoice and a bill of supply?",
    a: "Yes. A registered business raises a tax invoice when it charges GST. A bill of supply is used when no GST is charged, for example by a composition-scheme dealer or when supplying exempt goods. A bill of supply looks similar but does not show any tax amount.",
  },
  {
    q: "How many digits of HSN code do I need on an invoice?",
    a: "If your annual turnover is above ₹5 crore you need a 6-digit HSN code. Up to ₹5 crore, a 4-digit code is required on B2B invoices and is generally optional for B2C. Getting the HSN right matters because it decides the GST rate.",
  },
  {
    q: "Can I make a GST invoice for free?",
    a: "Yes. You can create a fully compliant GST invoice for free using Paavti's invoice generator, with all the mandatory fields already built in. There is no watermark and no signup needed to start.",
  },
  {
    q: "How many copies of a GST invoice are needed?",
    a: "For goods, three copies are prepared: the original for the recipient, a duplicate for the transporter, and a triplicate for the supplier. For services, two copies are enough: the original for the recipient and a duplicate for the supplier.",
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
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "GST Invoice Format: Rules, Mandatory Fields & Free Example",
    author: { "@type": "Organization", name: "Paavti" },
    publisher: { "@type": "Organization", name: "Paavti" },
    mainEntityOfPage: "https://paavti.com/gst-invoice-format",
  };

  return (
    <>
      <SiteHeader />
      <main className="text-[#0f1f5c]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

        <section className="bg-gradient-to-b from-[#eff4ff] to-white">
          <div className="mx-auto max-w-6xl px-5 pt-12 pb-6 text-center">
            <span className="inline-block rounded-full bg-[#e0eaff] px-3.5 py-1.5 text-[13px] font-semibold text-[#1d4ed8]">
              Updated for current GST rules
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              GST Invoice Format
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Every field a GST invoice must carry under Indian law, laid out with a clean example.
              When you are ready, make your own compliant invoice free in under a minute.
            </p>
            <a
              href="/gst-invoice-generator"
              className="mt-6 inline-block rounded-lg bg-[#2563eb] px-5 py-3 text-base font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Make a GST invoice free
            </a>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5">
          <section className="py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">What is a GST invoice?</h2>
            <p className="mt-3">
              A GST invoice, or tax invoice, is the document a registered business issues whenever it
              sells goods or services and charges GST. It is the proof of supply, and it is what lets
              your buyer claim input tax credit. If any of the required details are missing, your buyer
              can lose that credit, so the format matters.
            </p>
            <p className="mt-3">
              The fields below are set out in Rule 46 of the CGST Rules. You do not have to memorise
              them: the example further down shows exactly how they fit together, and the free generator
              fills them in for you.
            </p>
          </section>

          <section className="border-t border-slate-200 py-12">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">Mandatory fields on a GST invoice</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.t} className="rounded-xl border border-slate-200 p-4">
                  <div className="font-semibold text-[#0f1f5c]">{f.t}</div>
                  <div className="mt-1 text-sm text-slate-500">{f.d}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Example invoice */}
        <div className="mx-auto max-w-4xl px-5">
          <section className="border-t border-slate-200 py-12">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">A GST invoice example</h2>
            <p className="mt-3 text-slate-500">Here is what a correct tax invoice looks like with every field in place.</p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#f8faff] px-6 py-5">
                <div>
                  <div className="text-lg font-bold text-[#0f1f5c]">Sharma Traders</div>
                  <div className="text-sm text-slate-500">14, MG Road, Pune, Maharashtra 411001</div>
                  <div className="text-sm text-slate-500">GSTIN: 27ABCDE1234F1Z5</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold uppercase tracking-wide text-[#2563eb]">Tax Invoice</div>
                  <div className="mt-1 text-sm text-slate-500">Invoice No: INV-2026-014</div>
                  <div className="text-sm text-slate-500">Date: 27 Jul 2026</div>
                </div>
              </div>

              <div className="grid gap-4 border-b border-slate-200 px-6 py-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</div>
                  <div className="mt-1 text-sm font-semibold text-[#0f1f5c]">Verma Enterprises</div>
                  <div className="text-sm text-slate-500">22, FC Road, Pune, Maharashtra 411004</div>
                  <div className="text-sm text-slate-500">GSTIN: 27FGHIJ5678K1Z3</div>
                </div>
                <div className="sm:text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Place of supply</div>
                  <div className="mt-1 text-sm text-slate-500">Maharashtra (27)</div>
                  <div className="mt-2 text-xs text-slate-400">Reverse charge: No</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="bg-[#f8faff] text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2.5 font-semibold">Item</th>
                      <th className="px-4 py-2.5 font-semibold">HSN</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Rate</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Taxable</th>
                      <th className="px-4 py-2.5 text-right font-semibold">GST</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-2.5">Office chair</td>
                      <td className="px-4 py-2.5">9401</td>
                      <td className="px-4 py-2.5 text-right">4</td>
                      <td className="px-4 py-2.5 text-right">Rs. 3,000</td>
                      <td className="px-4 py-2.5 text-right">Rs. 12,000</td>
                      <td className="px-4 py-2.5 text-right">18%</td>
                      <td className="px-4 py-2.5 text-right">Rs. 14,160</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-2.5">Study desk</td>
                      <td className="px-4 py-2.5">9403</td>
                      <td className="px-4 py-2.5 text-right">2</td>
                      <td className="px-4 py-2.5 text-right">Rs. 5,000</td>
                      <td className="px-4 py-2.5 text-right">Rs. 10,000</td>
                      <td className="px-4 py-2.5 text-right">18%</td>
                      <td className="px-4 py-2.5 text-right">Rs. 11,800</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                <div className="w-full max-w-xs text-sm">
                  <div className="flex justify-between py-1 text-slate-500"><span>Taxable value</span><span>Rs. 22,000</span></div>
                  <div className="flex justify-between py-1 text-slate-500"><span>CGST (9%)</span><span>Rs. 1,980</span></div>
                  <div className="flex justify-between py-1 text-slate-500"><span>SGST (9%)</span><span>Rs. 1,980</span></div>
                  <div className="mt-1 flex justify-between border-t border-slate-200 py-2 text-base font-bold text-[#0f1f5c]"><span>Total</span><span>Rs. 25,960</span></div>
                </div>
              </div>

              <div className="flex items-end justify-between gap-4 border-t border-slate-200 bg-[#f8faff] px-6 py-4">
                <div className="text-xs text-slate-400">Amount in words: Twenty five thousand nine hundred sixty rupees only</div>
                <div className="text-right text-sm text-slate-500">
                  <div className="mb-6">For Sharma Traders</div>
                  <div className="text-xs text-slate-400">Authorised signatory</div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              This is an inter-state example within Maharashtra, so GST splits into CGST and SGST. For a
              sale to another state you would show IGST instead. The
              {" "}
              <a href="/gst-invoice-generator" className="font-semibold text-[#2563eb] hover:underline">free generator</a>
              {" "}
              handles both automatically.
            </p>
          </section>
        </div>

        <div className="mx-auto max-w-3xl px-5">
          <section className="border-t border-slate-200 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">Tax invoice vs bill of supply</h2>
            <p className="mt-3">
              If you are registered under GST and charging tax, you raise a tax invoice like the one
              above. If you are a composition-scheme dealer, or you are supplying exempt goods where no
              GST applies, you raise a bill of supply instead. It carries the same identifying details
              but shows no tax amount, and it says bill of supply rather than tax invoice.
            </p>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">HSN code digits by turnover</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Turnover above ₹5 crore: 6-digit HSN code required.</li>
              <li>Turnover up to ₹5 crore, B2B invoices: 4-digit HSN code required.</li>
              <li>Turnover up to ₹5 crore, B2C invoices: 4-digit code is generally optional.</li>
            </ul>
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
            <h2 className="text-2xl font-bold">Skip the template, make it now</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Create a fully compliant GST invoice with every mandatory field built in. Free, no
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
