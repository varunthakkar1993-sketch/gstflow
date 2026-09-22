"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";

/**
 * FunnelTracker — one globally-mounted component that instruments the whole
 * free-tool → signup → activation funnel, and shows the save-to-account prompt.
 *
 * It is deliberately generic rather than wired into each tool, so adding a new
 * tool page means adding one line to TOOLS below and nothing else.
 *
 * Events emitted:
 *   tool_viewed          — landed on a tool page
 *   tool_used            — first real interaction with the tool (once per view)
 *   tool_downloaded      — clicked any "Download…" control on a tool page
 *   save_prompt_shown    — the account prompt appeared
 *   save_prompt_clicked  — they clicked through to signup
 *   save_prompt_dismissed
 *   signup_started       — reached /signup
 *
 * Signed-in visitors never see the prompt and do not emit prompt events.
 */

const TOOLS: Record<string, string> = {
  "/payment-receipt-generator": "payment_receipt",
  "/quotation-generator": "quotation",
  "/gstin-validator": "gstin_validator",
  "/gst-invoice-generator": "gst_invoice",
  "/rent-receipt-generator": "rent_receipt",
  "/gst-calculator": "gst_calculator",
  "/gst-rate-finder": "gst_rate_finder",
  "/gst-invoice-format": "gst_invoice_format",
  "/tools": "tools_index",
};

type Prompt = { title: string; body: string; cta: string };

const PROMPTS: Record<string, Prompt> = {
  payment_receipt: {
    title: "Keep your receipts in one numbered series",
    body: "A free account numbers every receipt for you and matches it to the invoice it settles — so you can always prove what is still outstanding.",
    cta: "Create a free account",
  },
  quotation: {
    title: "Turn this quote into an invoice later",
    body: "A free account saves your clients and converts an accepted quotation into a GST invoice in one click, without retyping anything.",
    cta: "Create a free account",
  },
  gstin_validator: {
    title: "Checking suppliers regularly?",
    body: "A free account saves your client list with their GSTINs, so the right number is already filled in every time you bill them.",
    cta: "Create a free account",
  },
  gst_invoice: {
    title: "Keep this invoice, and the next one",
    body: "A free account saves your invoices, tracks which are paid, and builds your GSTR-1 from them at filing time.",
    cta: "Create a free account",
  },
  rent_receipt: {
    title: "Need these again next year?",
    body: "A free account keeps your receipts so you can regenerate a full year in seconds instead of starting over.",
    cta: "Create a free account",
  },
};

const DEFAULT_PROMPT: Prompt = {
  title: "Keep your documents in one place",
  body: "A free Paavti account saves everything you create here, tracks what is paid, and builds your GST returns from it.",
  cta: "Create a free account",
};

function isSignedIn(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("firebase:authUser:")) return true;
    }
  } catch {
    // Private mode or blocked storage — treat as signed out.
  }
  return false;
}

export default function FunnelTracker() {
  // Every link on the site is a plain <a href>, so each navigation is a full
  // page load and reading the path once on mount is enough. This deliberately
  // avoids next/navigation so the component does not depend on router internals.
  const [pathname, setPathname] = useState<string | null>(null);
  useEffect(() => {
    setPathname(window.location.pathname.replace(/\/+$/, "") || "/");
  }, []);

  const tool = pathname ? TOOLS[pathname] : undefined;

  const [showPrompt, setShowPrompt] = useState(false);
  const usedRef = useRef(false);
  const downloadedRef = useRef(false);

  // /signup — record that someone reached the form, and where from.
  useEffect(() => {
    if (pathname !== "/signup") return;
    let from = "";
    try {
      from = new URLSearchParams(window.location.search).get("from") || "";
    } catch {
      /* ignore */
    }
    posthog.capture("signup_started", { from: from || "direct" });
  }, [pathname]);

  // Tool pages — view, first use, and download.
  useEffect(() => {
    if (!tool) return;

    usedRef.current = false;
    downloadedRef.current = false;
    setShowPrompt(false);

    posthog.capture("tool_viewed", {
      tool,
      referring_domain: (() => {
        try {
          return document.referrer ? new URL(document.referrer).hostname : "direct";
        } catch {
          return "unknown";
        }
      })(),
    });

    const onInteract = () => {
      if (usedRef.current) return;
      usedRef.current = true;
      posthog.capture("tool_used", { tool });
    };

    const onClick = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.("button, a");
      if (!el) return;
      const text = (el.textContent || "").toLowerCase();
      if (!/download/.test(text)) return;
      if (downloadedRef.current) return;
      downloadedRef.current = true;

      posthog.capture("tool_downloaded", { tool });
      onInteract();

      if (isSignedIn()) return;
      try {
        if (sessionStorage.getItem(`paavti_prompt_dismissed_${tool}`)) return;
      } catch {
        /* ignore */
      }
      // Let the download start before the prompt slides in.
      window.setTimeout(() => {
        setShowPrompt(true);
        posthog.capture("save_prompt_shown", { tool });
      }, 900);
    };

    document.addEventListener("input", onInteract, true);
    document.addEventListener("change", onInteract, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("input", onInteract, true);
      document.removeEventListener("change", onInteract, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [tool]);

  const dismiss = useCallback(() => {
    setShowPrompt(false);
    if (!tool) return;
    posthog.capture("save_prompt_dismissed", { tool });
    try {
      sessionStorage.setItem(`paavti_prompt_dismissed_${tool}`, "1");
    } catch {
      /* ignore */
    }
  }, [tool]);

  if (!showPrompt || !tool) return null;

  const prompt = PROMPTS[tool] || DEFAULT_PROMPT;

  return (
    <div
      role="dialog"
      aria-label={prompt.title}
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:flex-row sm:items-center sm:gap-5">
        <div className="flex-1">
          <p className="text-[15px] font-bold text-[#0f1f5c]">{prompt.title}</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">{prompt.body}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`/signup?from=${tool}`}
            onClick={(e) => {
              posthog.capture("save_prompt_clicked", { tool });
              // Give the event a moment to leave before the page unloads, but
              // never hijack cmd/ctrl/shift/middle clicks — those open a new tab
              // and the page is not unloading anyway.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              window.setTimeout(() => {
                window.location.href = `/signup?from=${tool}`;
              }, 200);
            }}
            className="rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            {prompt.cta}
          </a>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-600"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
