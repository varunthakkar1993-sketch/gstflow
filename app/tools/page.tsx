import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * /tools: hub linking every Paavti free tool. Pure Server Component.
 * ItemList JSON-LD + internal links spread ranking strength across all tool pages.
 */

export const metadata: Metadata = {
  title: "Free GST & Invoicing Tools for India | Paavti",
  description:
    "Free tools for Indian freelancers and small businesses: GST invoices, quotations, rent and payment receipts, a GST calculator and rate finder. No signup to start.",
  alternates: { canonical: "https://paavti.com/tools" },
  openGraph: {
    title: "Free GST & Invoicing Tools for India | Paavti",
    description: "GST invoices, quotations, receipts, a GST calculator and rate finder. All free.",
    url: "https://paavti.com/tools",
    siteName: "Paavti",
    locale: "en_IN",
    type: "website",
  },
};

type Tool = { href: string; icon: string; title: string; desc: string; tag?: string };

const create: Tool[] = [
  { href: "/gst-invoice-generator", icon: "🧾", title: "GST Invoice Generator", desc: "Create a compliant GST invoice with CGST, SGST or IGST and download a clean PDF." },
  { href: "/quotation-generator", icon: "📄", title: "Quotation Generator", desc: "Send a professional quotation or estimate with line items, GST and validity." },
  { href: "/rent-receipt-generator", icon: "🏠", title: "Rent Receipt Generator", desc: "Generate rent receipts for your HRA claim in seconds, ready to download." },
  { href: "/payment-receipt-generator", icon: "✅", title: "Payment Receipt Generator", desc: "Issue proof of payment with the amount in words and the mode of payment." },
];

const calc: Tool[] = [
  { href: "/gst-calculator", icon: "🧮", title: "GST Calculator", desc: "Add or remove GST from any amount and see the CGST and SGST split instantly." },
  { href: "/gst-rate-finder", icon: "🔎", title: "GST Rate Finder", desc: "Look up the current GST rate and HSN or SAC code for any product or service." },
];

const guides: Tool[] = [
  { href: "/gst-invoice-format", icon: "📚", title: "GST Invoice Format", desc: "Every mandatory field on a GST invoice under Rule 46, with a clean example.", tag: "Guide" },
];

const all = [...create, ...calc, ...guides];

function Card({ t }: { t: Tool }) {
  return (
    <a href={t.href} className="group block rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-[#2563eb] hover:shadow-lg">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff4ff] text-xl">{t.icon}</div>
      <div className="mt-4 flex items-center gap-2">
        <h3 className="text-lg font-bold text-[#0f1f5c]">{t.title}</h3>
        {t.tag ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{t.tag}</span> : null}
      </div>
      <p className="mt-1.5 text-sm text-slate-500">{t.desc}</p>
      <span className="mt-3 inline-block text-[13px] font-semibold text-[#2563eb]">Open the tool →</span>
    </a>
  );
}

export default function Page() {
  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Paavti Free GST & Invoicing Tools",
    itemListElement: all.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.title,
      url: `https://paavti.com${t.href}`,
    })),
  };

  return (
    <>
      <SiteHeader />
      <main className="text-[#0f1f5c]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }} />

        <section className="bg-gradient-to-b from-[#eff4ff] to-white">
          <div className="mx-auto max-w-6xl px-5 pt-12 pb-8 text-center">
            <span className="inline-block rounded-full bg-[#e0eaff] px-3.5 py-1.5 text-[13px] font-semibold text-[#1d4ed8]">
              Free to use · No signup to start
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Free GST &amp; invoicing tools
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Everything an Indian freelancer or small business needs to bill, get paid and stay GST
              compliant. Free to use, no signup to start.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 py-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Create documents</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {create.map((t) => <Card key={t.href} t={t} />)}
          </div>

          <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-slate-400">Calculate &amp; look up</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {calc.map((t) => <Card key={t.href} t={t} />)}
          </div>

          <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-slate-400">Guides</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guides.map((t) => <Card key={t.href} t={t} />)}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-5">
          <div className="my-9 rounded-2xl bg-[#0f1f5c] px-5 py-11 text-center text-white">
            <h2 className="text-2xl font-bold">One account for all your billing</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Create a free Paavti account to save clients, track payments and turn any quote into a GST
              invoice in one click.
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
