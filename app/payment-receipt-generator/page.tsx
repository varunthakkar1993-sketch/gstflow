import type { Metadata } from "next";
import PaymentReceiptGenerator from "./PaymentReceiptGenerator";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /payment-receipt-generator: free payment / money receipt generator.
 * Server Component (SEO + JSON-LD) wrapping a client-side tool. Client-side only, no DB.
 */

export const metadata: Metadata = {
  title: "UPI Payment Receipt Generator — Free Online (India) | Paavti",
  description:
    "Free UPI payment receipt generator. Enter amount, payer and reference, then download a PDF receipt. Works for GPay, PhonePe, Paytm, cash and bank transfer.",
  keywords: [
    "upi payment receipt generator",
    "upi receipt generator",
    "payment receipt generator",
    "online payment receipt",
    "money receipt online",
    "bank payment receipt generator",
    "gpay payment receipt generator",
    "paytm receipt generator",
    "cash receipt generator",
    "payment receipt format",
    "receipt maker online",
  ],
  alternates: { canonical: "https://paavti.com/payment-receipt-generator" },
  openGraph: {
    title: "Free UPI Payment Receipt Generator Online | Paavti",
    description:
      "Create a UPI, bank transfer or cash payment receipt in under a minute. Free, no login needed.",
    url: "https://paavti.com/payment-receipt-generator",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
};

const faqs = [
  {
    q: "How do I make a UPI payment receipt?",
    a: "Enter your business details, the name of the person who paid, the amount, and pick UPI as the payment mode. Add the UPI transaction reference so the payment can be traced later, then download the PDF and send it. No account needed.",
  },
  {
    q: "Is a UPI screenshot the same as a payment receipt?",
    a: "No. A screenshot from GPay, PhonePe or Paytm is the payer's proof that they sent money. A payment receipt is the recipient's acknowledgement that it arrived, issued on your letterhead with your details, a receipt number and a signature. Accountants and auditors want the receipt, not the screenshot.",
  },
  {
    q: "Does this work for GPay, PhonePe and Paytm?",
    a: "Yes. They all run on UPI, so the receipt is the same document. Pick the app by name as the payment mode if you want it recorded specifically, and paste the transaction reference from the app.",
  },
  {
    q: "What is the difference between an invoice and a payment receipt?",
    a: "An invoice is a request for payment you send before you are paid. A payment receipt is proof that the money was actually received, sent after payment. Many businesses issue a receipt for every payment so both sides have a clear record.",
  },
  {
    q: "What should a payment receipt include?",
    a: "Your business name and GSTIN if you have one, a unique receipt number and date, the name of the payer, the amount received in figures and words, the payment mode and reference, the invoice it settles, and an authorised signature.",
  },
  {
    q: "Is this payment receipt generator free?",
    a: "Yes. You can create and download payment receipts for free with no watermark and no login. A free Paavti account additionally lets you track which invoices are paid and match receipts to them.",
  },
  {
    q: "Can I use this for cash, cheque or bank transfer?",
    a: "Yes. Cash, bank transfer, cheque and card are all available as payment modes, and the receipt format is the same. For cash especially, a written receipt is worth issuing every time, since there is no bank record backing it up.",
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
    name: "Paavti UPI Payment Receipt Generator",
    alternateName: "Paavti Payment Receipt Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://paavti.com/payment-receipt-generator",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to make a UPI payment receipt",
    step: [
      { "@type": "HowToStep", name: "Add your details", text: "Enter your business name, contact details and GSTIN, and give the receipt a number." },
      { "@type": "HowToStep", name: "Enter the payment", text: "Add who paid, how much, and select UPI as the payment mode." },
      { "@type": "HowToStep", name: "Add the reference", text: "Paste the UPI transaction reference from GPay, PhonePe or Paytm and link the invoice it settles." },
      { "@type": "HowToStep", name: "Download and send", text: "Download the receipt as a PDF and send it to the payer." },
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
              UPI Payment Receipt Generator
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Send proof of payment in under a minute. Enter the amount, payer and mode, then download a
              clean PDF receipt. Works for UPI, GPay, PhonePe, Paytm, cash, cheque and bank transfer.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5">
          <PaymentReceiptGenerator />
        </div>

        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              How to make a payment receipt
            </h2>
            <p className="mt-3">
              A payment receipt, or money receipt, is proof that you have received a payment. You send it
              after the money reaches you, so both you and the payer have a clear record. Fill in who paid,
              how much, the mode of payment and the invoice it settles, then download the PDF and send it.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-6">
              <li>Add your business details and a receipt number</li>
              <li>Enter who you received the payment from and the amount</li>
              <li>Choose the payment mode and add the transaction reference</li>
              <li>Link it to the invoice it settles</li>
              <li>Download the receipt as a PDF and send it</li>
            </ol>
            <p className="mt-3">
              Only issue a receipt for money you have actually received. A receipt is an acknowledgement of
              a real payment, and issuing one for a payment that never arrived creates a false record in
              both sides&apos; books.
            </p>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              A UPI screenshot is not a receipt
            </h2>
            <p className="mt-3">
              This is the single most common mix-up in small-business billing. When a client pays you over
              UPI, they screenshot the success screen in GPay, PhonePe or Paytm and send it across. That
              screenshot is <em>their</em> evidence that money left their account. It is not your
              acknowledgement that it arrived.
            </p>
            <p className="mt-3">
              A payment receipt is issued by the person receiving the money. It carries your business name
              and GSTIN, a receipt number in your own series, the date, the amount in words as well as
              figures, and a signature. That is the document a client&apos;s accountant files, and the one an
              auditor asks for. Screenshots get lost in chat threads; a numbered receipt sits in the books.
            </p>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              GPay, PhonePe, Paytm — one receipt for all of them
            </h2>
            <p className="mt-3">
              These are apps sitting on top of UPI, not separate payment systems, so the receipt is
              identical whichever one the client used. What matters is that you record the{" "}
              <strong>UPI transaction reference</strong> — the twelve-digit number the app shows after a
              successful payment. That reference is what lets either side trace the payment months later
              when a bank statement and an invoice do not line up.
            </p>
            <p className="mt-3">
              If you want the specific app named on the receipt, pick it from the payment mode dropdown
              above. Otherwise plain &ldquo;UPI&rdquo; is correct and is what most accountants prefer.
            </p>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              What a good payment receipt includes
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Your business name, contact details and GSTIN if you have one</li>
              <li>A unique receipt number and the date of receipt</li>
              <li>The name of the person or business who paid</li>
              <li>The amount received in both figures and words</li>
              <li>The payment mode — UPI, cash, bank transfer, cheque or card</li>
              <li>The UPI or bank transaction reference, so the payment can be traced</li>
              <li>The invoice the payment settles and an authorised signature</li>
            </ul>

            <h2 className="mt-10 text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">
              Why receipt numbers matter
            </h2>
            <p className="mt-3">
              Receipts should run in one unbroken series — RCP-001, RCP-002, and so on — with no gaps and
              no duplicates. A broken series is the first thing that looks wrong in a review, because it
              suggests receipts were issued and then removed. Keeping the numbering continuous costs
              nothing at the time and saves an awkward explanation later.
            </p>
            <p className="mt-3">
              Partial payments deserve their own receipt each. If a client pays half now and half in three
              weeks, issue two receipts against the same invoice rather than one at the end — that way the
              invoice&apos;s outstanding balance is always provable from the receipts alone.
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

        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1f5c] sm:text-3xl">Other free tools</h2>
            <p className="mt-3">
              Paavti has a set of free tools for Indian freelancers and small businesses, all usable without
              an account:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li><a className="text-[#2563eb] underline" href="/gst-invoice-generator">GST invoice generator</a> — a compliant tax invoice with CGST/SGST/IGST split</li>
              <li><a className="text-[#2563eb] underline" href="/quotation-generator">Online quotation maker</a> — quotes and estimates with GST and validity</li>
              <li><a className="text-[#2563eb] underline" href="/rent-receipt-generator">Rent receipt generator</a> — HRA-ready rent receipts</li>
              <li><a className="text-[#2563eb] underline" href="/gstin-validator">GSTIN validator</a> — check and decode any GST number, single or bulk</li>
              <li><a className="text-[#2563eb] underline" href="/gst-calculator">GST calculator</a> — add or remove GST from any amount</li>
            </ul>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5">
          <div className="my-9 rounded-2xl bg-[#0f1f5c] px-5 py-11 text-center text-white">
            <h2 className="text-2xl font-bold">Know exactly which invoices are paid</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Create a free account to match every payment to its invoice, keep your receipt numbers in one
              unbroken series, and send receipts the moment you are paid.
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
