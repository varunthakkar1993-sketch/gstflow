<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Paavti, a GST invoice management app for Indian freelancers and businesses. PostHog is initialized via `instrumentation-client.ts` (Next.js 15.3+ pattern), with a reverse proxy configured in `next.config.ts` to route all analytics through `/ingest`. A server-side PostHog client in `lib/posthog-server.ts` handles API route tracking. Users are identified at login and signup using their Firebase UID as the distinct ID, ensuring client and server events are correlated. Error tracking (`captureException`) is added at login, signup, and invoice generation failure paths.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User successfully creates a new account | `app/(auth)/signup/page.tsx` |
| `user_logged_in` | User successfully logs in with email and password | `app/(auth)/login/page.tsx` |
| `invoice_generated` | User generates and downloads an invoice PDF | `app/editor/page.tsx` |
| `invoice_emailed` | User emails an invoice to a client | `app/editor/page.tsx` |
| `invoice_whatsapped` | User shares an invoice via WhatsApp | `app/editor/page.tsx` |
| `invoice_status_changed` | User toggles an invoice status (unpaid → sent → paid) | `app/dashboard/page.tsx` |
| `quote_generated` | User generates and downloads a quote PDF | `app/quote-editor/page.tsx` |
| `quote_emailed` | User emails a quote to a client | `app/quote-editor/page.tsx` |
| `quote_whatsapped` | User shares a quote via WhatsApp | `app/quote-editor/page.tsx` |
| `quote_status_changed` | User changes a quote's status (draft → sent → accepted → rejected) | `app/quotes/page.tsx` |
| `upgrade_prompt_shown` | Free-tier limit modal is shown when user hits monthly quota | `app/quote-editor/page.tsx` |
| `upgrade_clicked` | User clicks a pricing plan button to initiate payment | `app/pricing/page.tsx` |
| `invoice_send_completed` | Server confirms invoice email was delivered via SendGrid | `app/api/send-invoice/route.ts` |
| `payment_order_created` | Server creates a Razorpay payment order for a subscription plan | `app/api/razorpay-order/route.ts` |
| `payment_verified` | Server verifies Razorpay payment and activates subscription | `app/api/razorpay-verify/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1647887)
- [New Signups Over Time](/insights/VBvUtMRU) — daily user registrations
- [Invoices & Quotes Generated](/insights/pKDhWcaw) — volume of documents created per day
- [Signup to Payment Conversion Funnel](/insights/V2QZ0QGk) — end-to-end conversion from signup through to paid subscription
- [Upgrade Prompt Shown vs Payments Verified](/insights/3C8CRLum) — free-limit hit rate vs actual conversion to paid
- [Invoice Delivery Methods](/insights/iTdGaNfI) — how users share invoices (email vs WhatsApp) for invoices and quotes

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
