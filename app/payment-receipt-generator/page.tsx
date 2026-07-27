import type { Metadata } from "next";
import PaymentReceiptGenerator from "./PaymentReceiptGenerator";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /payment-receipt-generator: free payment / money receipt generator.
 * Server Component (SEO + JSON-LD) wrapping a client-side tool. Client-side only, no DB.
 */

export const metadata: Metadata = {
  title: "Free Payment Receipt Generator Online (India) | Paavti",
  description:
    "Create a payment receipt or money receipt online for free. Enter the amount, payer and mode, then download a clean PDF. No signup needed to start.",
  keywords: [
    "payment receipt generator",
    "money receipt format",
    "cash receipt generator",
    "payment receipt format",
    "receipt maker online",
  ],
  alternates: { canonical: "https://paavti.com/payment-receipt-generator" },
  openGraph: {
    title: "Free Payment Receipt Generator Online | Paavti",
    description: "Create a payment receipt in under a minute. Free, no signup to start.",
    url: "https://paavti.com/payment-receipt-generator",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
};

const faqs = [
  {
    q: "How do I make a payment receipt?",
    a: "Enter your business details, the name of the person you received money from, the amount, the payment mode such as cash or UPI, and the invoice it is against. The tool converts the amount into words and gives you a clean PDF to send. No account needed to start.",
  },
  {
    q: "What is the difference between an invoice and a payment receipt?",
    a: "An invoice is a request for payment you send before you are paid. A payment receipt is proof that the money was actually received, sent after payment. Many businesses issue a receipt for every payment so both sides have a clear record.",
  },
  {
    q: "What should a payment receipt include?",
    a: "Your business name and GSTIN if you have one, a unique receipt number and date, the name of the payer, the amount received in figures and words, the payment mode, the invoice it settles, and an authorised signature.",
  },
  {
    q: "Is this payment receipt generator free?",
    a: "Yes. You can create and download payment receipts for free with no watermark. A free Paavti account additionally lets you track which invoices are paid and match receipts to them.",
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
    name: "Paavti Payment Receipt Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://paavti.com/payment-receipt-generator",
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
              Free Payment Receipt Generator
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Send proof of payment in under a minute. Enter the amount, payer and mode, then download a
              clean PDF receipt. Built for Indian freelancers &amp; small businesses.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5">
          <PaymentReceiptGenerator />
        </div>

        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">How to make a payment receipt</h2>
            <p className="mt-3">
              A payment receipt, or money receipt, is proof that you have received a payment. You send it
              after the money reaches you, so both you and the payer have a clear record. Fill in who paid,
              how much, the mode of payment and the invoice it settles, then download the PDF and send it.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-6">
              <li>Add your business details and a receipt number</li>
              <li>Enter who you received the payment from and the amount</li>
              <li>Choose the payment mode and link it to an invoice</li>
              <li>Download the receipt as a PDF and send it</li>
            </ol>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">What a good payment receipt includes</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Your business name, contact details and GSTIN if you have one</li>
              <li>A unique receipt number and the date of receipt</li>
              <li>The name of the person or business who paid</li>
              <li>The amount received in both figures and words</li>
              <li>The payment mode such as cash, UPI, bank transfer or cheque</li>
              <li>The invoice the payment settles and an authorised signature</li>
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
            <h2 className="text-2xl font-bold">Know exactly which invoices are paid</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Create a free account to match every payment to its invoice and send receipts
              automatically the moment you are paid.
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
