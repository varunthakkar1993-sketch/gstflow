import type { Metadata } from "next";
import QuotationGenerator from "./QuotationGenerator";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /quotation-generator: free quotation / estimate generator.
 * Server Component (SEO + JSON-LD) wrapping a client-side tool. Client-side only, no DB.
 */

export const metadata: Metadata = {
  title: "Free Quotation Generator Online (India) | Paavti",
  description:
    "Create professional quotations and estimates online for free. Add items, GST and validity, then download a clean PDF. No signup needed to start.",
  keywords: [
    "quotation generator",
    "free quotation generator",
    "quotation format",
    "quotation maker online",
    "estimate generator",
  ],
  alternates: { canonical: "https://paavti.com/quotation-generator" },
  openGraph: {
    title: "Free Quotation Generator Online | Paavti",
    description: "Create a professional quotation in under a minute. Free, no signup to start.",
    url: "https://paavti.com/quotation-generator",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
};

const faqs = [
  {
    q: "How do I make a quotation?",
    a: "Add your business and client details, list each item with its quantity, rate and GST, set a validity date, and add any terms. The tool totals it up and gives you a clean PDF to send. No account needed to start.",
  },
  {
    q: "What is the difference between a quotation and an invoice?",
    a: "A quotation is an offer sent before work begins, telling the client what something will cost. An invoice is a demand for payment sent after the work is done. On Paavti you can create a quote first and convert it into an invoice once it is accepted.",
  },
  {
    q: "What should a quotation include?",
    a: "Your business name and contact details, the client's name, a unique quotation number and date, a clear list of items with prices, any applicable GST, the total, a validity period, and your terms such as advance and delivery.",
  },
  {
    q: "Is this quotation generator free?",
    a: "Yes. You can create and download quotations for free with no watermark. A free Paavti account lets you save clients and convert quotes into invoices.",
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
    name: "Paavti Quotation Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://paavti.com/quotation-generator",
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
              Free to use · No signup to start
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Free Quotation Generator
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Send a professional quotation in under a minute. Add your items, GST and validity,
              then download a clean PDF. Built for Indian freelancers &amp; small businesses.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5">
          <QuotationGenerator />
        </div>

        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">How to make a quotation</h2>
            <p className="mt-3">
              A quotation, or estimate, is what you send a client before starting work so they know
              exactly what it will cost. Fill in your details and theirs, list each item with a price
              and GST, set how long the quote is valid, add your terms, and download the PDF. When the
              client says yes, you can turn the same quote into an invoice.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-6">
              <li>Add your business and client details</li>
              <li>List each item with quantity, rate and GST</li>
              <li>Set a validity date and add your terms</li>
              <li>Download the quotation as a PDF and send it</li>
            </ol>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">What a good quotation includes</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Your business name, contact details and GSTIN if you have one</li>
              <li>The client's name and a unique quotation number with a date</li>
              <li>A clear line-by-line list of what you are quoting for</li>
              <li>Applicable GST and the total amount</li>
              <li>A validity period so the price is not open forever</li>
              <li>Terms such as advance payment and delivery timeline</li>
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
