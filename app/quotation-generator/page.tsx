import type { Metadata } from "next";
import QuotationGenerator from "./QuotationGenerator";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /quotation-generator: free quotation / estimate generator.
 * Server Component (SEO + JSON-LD) wrapping a client-side tool. Client-side only, no DB.
 */

export const metadata: Metadata = {
  title: "Free Online Quotation Maker & Generator (India) | Paavti",
  description:
    "Make a quotation online free, no login needed. Add items, GST and validity, then download a clean PDF. Quotation maker for Indian freelancers & small businesses.",
  keywords: [
    "quotation maker",
    "online quotation maker",
    "quotation generator",
    "free quotation maker",
    "quotation maker online free",
    "online quote generator",
    "create quotation online",
    "make quotation online",
    "quotation creator",
    "quotation format",
    "estimate generator",
  ],
  alternates: { canonical: "https://paavti.com/quotation-generator" },
  openGraph: {
    title: "Free Online Quotation Maker & Generator | Paavti",
    description:
      "Create a professional quotation online in under a minute. Free, no login needed.",
    url: "https://paavti.com/quotation-generator",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
};

const faqs = [
  {
    q: "Can I make a quotation online without login?",
    a: "Yes. This quotation maker works fully in your browser with no signup and no login. Fill in the details, download the PDF and send it. An account is optional and only useful if you want to save clients and reuse them later.",
  },
  {
    q: "Is this quotation generator free?",
    a: "Yes, completely free, with no watermark and no limit on how many quotations you create. A free Paavti account adds saved clients and one-click conversion of a quote into a GST invoice.",
  },
  {
    q: "How do I make a quotation?",
    a: "Add your business and client details, list each item with its quantity, rate and GST, set a validity date, and add your terms. The tool totals it up and gives you a clean PDF to send.",
  },
  {
    q: "What is the difference between a quotation, an estimate and a proforma invoice?",
    a: "A quotation is a firm offer with fixed prices, valid for a stated period. An estimate is an approximate figure that may change once the work is scoped. A proforma invoice is a more formal document sent when the client has effectively agreed and needs something to raise a purchase order or release an advance. All three are sent before the work, unlike a tax invoice which follows it.",
  },
  {
    q: "What should a quotation include?",
    a: "Your business name and contact details, the client's name, a unique quotation number and date, a clear line-by-line list of items with prices, any applicable GST, the total, a validity period, and your terms such as advance payment and delivery timeline.",
  },
  {
    q: "Do I need to add GST to a quotation?",
    a: "If you are GST registered, show the GST on the quotation so the client sees the full payable amount rather than getting a surprise at invoice stage. If you are not registered, leave the GST out and do not mention a GSTIN. Either way, state clearly whether your prices are inclusive or exclusive of tax.",
  },
  {
    q: "How long should a quotation be valid?",
    a: "Fifteen to thirty days is normal for most service work. Set a validity date whenever your own costs can move, so you are not held to a price you quoted months earlier.",
  },
  {
    q: "Can I convert a quotation into an invoice?",
    a: "Yes. With a free Paavti account, an accepted quotation converts into a GST invoice in one click, carrying the line items, client and totals across so you do not retype anything.",
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
    name: "Paavti Online Quotation Maker",
    alternateName: "Paavti Quotation Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://paavti.com/quotation-generator",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to make a quotation online",
    step: [
      { "@type": "HowToStep", name: "Add your details", text: "Enter your business name, contact details and GSTIN, then the client's name and address." },
      { "@type": "HowToStep", name: "List the items", text: "Add each item or service with its quantity, rate and GST percentage." },
      { "@type": "HowToStep", name: "Set validity and terms", text: "Choose how long the quotation stays valid and add your payment and delivery terms." },
      { "@type": "HowToStep", name: "Download and send", text: "Download the quotation as a PDF and send it to your client." },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="text-[#0f1f5c]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

        <section className="bg-gradient-to-b from-[#eff4ff] to-white">
          <div className="mx-auto max-w-6xl px-5 pt-12 pb-6 text-center">
            <span className="inline-block rounded-full bg-[#e0eaff] px-3.5 py-1.5 text-[13px] font-semibold text-[#1d4ed8]">
              Free · No login required
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Free Online Quotation Maker
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Create a professional quotation, quote or estimate online in under a minute —
              free, with no signup and no login. Add your items, GST and validity, then
              download a clean PDF. Built for Indian freelancers &amp; small businesses.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5">
          <QuotationGenerator />
        </div>

        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              How to make a quotation online
            </h2>
            <p className="mt-3">
              A quotation, sometimes called a quote or an estimate, is what you send a client
              before starting work so they know exactly what it will cost. Getting it right
              matters more than it looks: a vague quote invites scope creep and awkward
              conversations later, while a clear one with fixed line items and a validity date
              usually gets approved faster and protects your price.
            </p>
            <p className="mt-3">
              To create a quotation online with this tool, fill in your details and the
              client&apos;s, list each item with a price and GST, set how long the quote is valid,
              add your terms, and download the PDF. Nothing is uploaded anywhere — the whole
              thing runs in your browser. When the client says yes, you can turn the same quote
              into an invoice.
            </p>
            <ol className="mt-4 list-decimal space-y-1 pl-6">
              <li>Add your business and client details</li>
              <li>List each item with quantity, rate and GST</li>
              <li>Set a validity date and add your terms</li>
              <li>Download the quotation as a PDF and send it</li>
            </ol>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              What a good quotation includes
            </h2>
            <p className="mt-3">
              The standard quotation format used by Indian businesses is not legally prescribed
              the way a GST tax invoice is, but clients and their accounts teams expect a
              familiar shape. Leaving pieces out is the most common reason a quotation comes
              back with questions instead of an approval.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Your business name, contact details and GSTIN if you have one</li>
              <li>The client&apos;s name, address and GSTIN where applicable</li>
              <li>A unique quotation number with a date</li>
              <li>A clear line-by-line list of what you are quoting for, with quantity and rate</li>
              <li>Applicable GST, shown separately, and the total amount</li>
              <li>A validity period so the price is not open forever</li>
              <li>Terms such as advance payment, delivery timeline and what is excluded</li>
            </ul>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              Quotation, estimate or proforma invoice?
            </h2>
            <p className="mt-3">
              These three get used interchangeably and they are not the same thing. A{" "}
              <strong>quotation</strong> is a firm offer: the prices are fixed and hold until
              the validity date. An <strong>estimate</strong> is an approximation, useful when
              the scope is still loose, and everyone understands the final figure may move. A{" "}
              <strong>proforma invoice</strong> is the most formal of the three, sent once the
              client has effectively agreed and needs a document to raise a purchase order or
              release an advance payment.
            </p>
            <p className="mt-3">
              None of them is a tax invoice. A tax invoice is issued after the supply and is
              what the client uses to claim input tax credit — a quotation cannot be used for
              that, however it is worded.
            </p>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              Terms worth putting on every quotation
            </h2>
            <p className="mt-3">
              Most disputes come from what the quotation did not say. These lines take seconds
              to add and save a great deal later:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>&ldquo;This quotation is valid for 15 days from the date above.&rdquo;</li>
              <li>&ldquo;50% advance payable on confirmation, balance before delivery.&rdquo;</li>
              <li>&ldquo;Prices are exclusive of GST, which will be charged at the applicable rate.&rdquo;</li>
              <li>&ldquo;Delivery within 10 working days of receiving the advance and final inputs.&rdquo;</li>
              <li>&ldquo;Two rounds of revisions are included. Further revisions billed separately.&rdquo;</li>
              <li>&ldquo;Anything not listed above is outside the scope of this quotation.&rdquo;</li>
            </ul>
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

        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              Other free tools
            </h2>
            <p className="mt-3">
              Paavti has a set of free tools for Indian freelancers and small businesses, all
              usable without an account:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li><a className="text-[#2563eb] underline" href="/gst-invoice-generator">GST invoice generator</a> — a compliant tax invoice with CGST/SGST/IGST split</li>
              <li><a className="text-[#2563eb] underline" href="/payment-receipt-generator">Payment receipt generator</a> — UPI, bank transfer, cash and cheque receipts</li>
              <li><a className="text-[#2563eb] underline" href="/gstin-validator">GSTIN validator</a> — check and decode any GST number</li>
              <li><a className="text-[#2563eb] underline" href="/gst-rate-finder">GST rate finder</a> — HSN and SAC lookup with current rates</li>
              <li><a className="text-[#2563eb] underline" href="/gst-calculator">GST calculator</a> — add or remove GST from any amount</li>
            </ul>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5">
          <div className="my-9 rounded-2xl bg-[#0f1f5c] px-5 py-11 text-center text-white">
            <h2 className="text-2xl font-bold">Turn accepted quotes into invoices</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Create a free account to save your clients and convert any quotation into a
              GST invoice in one click.
            </p>
            <a href="/signup" className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#2563eb] hover:bg-slate-100">
              Create your free account
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
