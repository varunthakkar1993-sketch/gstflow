/**
 * Shared site footer — pair with <SiteHeader /> on SEO/landing pages.
 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Paavti" className="h-8 w-auto" />
        <div className="flex flex-wrap justify-center gap-6 text-[13px] text-slate-400">
          <a href="/gst-invoice-generator" className="hover:text-[#2563eb]">GST Invoice Generator</a>
          <a href="/pricing" className="hover:text-[#2563eb]">Pricing</a>
          <a href="/login" className="hover:text-[#2563eb]">Login</a>
          <a href="/signup" className="hover:text-[#2563eb]">Sign Up</a>
        </div>
        <div className="text-[13px] text-slate-400">© 2026 Paavti</div>
      </div>
    </footer>
  );
}
