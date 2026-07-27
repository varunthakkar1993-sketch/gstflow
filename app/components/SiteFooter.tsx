/**
 * Shared site footer, pair with <SiteHeader /> on SEO/landing pages.
 * The tools column interlinks every tool page (this footer renders on all of them).
 */
const tools = [
  { href: "/gst-invoice-generator", label: "GST Invoice Generator" },
  { href: "/gst-calculator", label: "GST Calculator" },
  { href: "/rent-receipt-generator", label: "Rent Receipt Generator" },
  { href: "/quotation-generator", label: "Quotation Generator" },
  { href: "/payment-receipt-generator", label: "Payment Receipt Generator" },
  { href: "/gst-rate-finder", label: "GST Rate Finder" },
  { href: "/gst-invoice-format", label: "GST Invoice Format" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Paavti" className="h-8 w-auto" />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-slate-400">
              Free GST invoicing and tax tools for Indian freelancers and small businesses.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Free tools</h4>
            <ul className="mt-3 space-y-2">
              {tools.map((t) => (
                <li key={t.href}>
                  <a href={t.href} className="text-[13px] text-slate-500 hover:text-[#2563eb]">{t.label}</a>
                </li>
              ))}
              <li>
                <a href="/tools" className="text-[13px] font-semibold text-[#2563eb] hover:underline">All free tools →</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paavti</h4>
            <ul className="mt-3 space-y-2">
              <li><a href="/pricing" className="text-[13px] text-slate-500 hover:text-[#2563eb]">Pricing</a></li>
              <li><a href="/signup" className="text-[13px] text-slate-500 hover:text-[#2563eb]">Sign up</a></li>
              <li><a href="/login" className="text-[13px] text-slate-500 hover:text-[#2563eb]">Login</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-100 pt-6 text-[13px] text-slate-400">© 2026 Paavti</div>
      </div>
    </footer>
  );
}
