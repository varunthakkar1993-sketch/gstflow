/**
 * Shared site header — use on SEO/landing pages so they carry the Paavti logo
 * and nav (your app/layout.tsx has no global header; the homepage renders its
 * own inline). Import this into any new page: <SiteHeader />.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#f0f4ff] bg-white">
      <nav className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5">
        <a href="/" aria-label="Paavti home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Paavti" className="h-10 w-auto" />
        </a>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-end">
          <a href="/#features" className="text-sm text-slate-500 hover:text-[#0f1f5c]">Features</a>
          <a href="/#how-it-works" className="hidden text-sm text-slate-500 hover:text-[#0f1f5c] sm:inline">How it works</a>
          <a href="/pricing" className="text-sm text-slate-500 hover:text-[#0f1f5c]">Pricing</a>
          <a href="/login" className="hidden text-sm text-slate-500 hover:text-[#0f1f5c] sm:inline">Login</a>
          <a href="/signup" className="rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">Start Free</a>
        </div>
      </nav>
    </header>
  );
}
