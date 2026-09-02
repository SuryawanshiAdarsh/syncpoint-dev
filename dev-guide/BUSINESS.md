# Business Readiness Guide

> How to actually receive money from a customer. Everything from incorporation to invoicing.
> Companion to [LEGAL.md](LEGAL.md) (contracts) and [DEPLOYMENT.md](DEPLOYMENT.md) (technical hosting).

## 1. The stack you need to take money

Six pieces, all required:

1. **Legal entity** — company that owns Syncpoint and can sign contracts
2. **Bank account** — where money lands
3. **Pricing model** — how much to charge and for what
4. **Billing system** — how the invoice gets to the customer
5. **Payment processor** — how the money moves
6. **Accounting** — how you track what came in and pay taxes

Each is a decision + a couple of hours of setup. This doc walks each one.

## 2. Legal entity

### Decision: incorporate as what, where?

| Option | Cost | Best for |
|---|---|---|
| **Delaware C-Corp** | ~$500 to form + ~$400/year franchise tax + registered agent ~$100/yr | Anyone planning to raise US VC or sell to US enterprise |
| **Delaware LLC** | Same-ish cost, easier taxes | Solo/co-founder team not raising VC |
| **UK Ltd** | ~£15 to form via Companies House | Founder in UK |
| **India Pvt Ltd** | ~₹15k to form via MCA | Founder in India |
| **Singapore Pte Ltd** | ~$1,500 via Osome or Sleek | International presence, tax efficiency |
| **Sole proprietor** | Free or nearly | Never — do not sign SaaS contracts as an individual |

### Recommendation

**Whatever's easiest wherever you already live.** Restructuring later is annoying but doable. For fastest first paying pilot:

- **US-based founder** → Delaware C-Corp via Stripe Atlas ($500, done in 1 week, includes registered agent + EIN)
- **India-based founder** → Private Limited via Vakilsearch or IndiaFilings (~₹15k, 2-3 weeks) OR Delaware C-Corp via Stripe Atlas if targeting US customers primarily
- **UK-based founder** → Ltd via Companies House online (£15, 24 hours)
- **EU-based founder** → check local; Estonia's e-Residency is popular for solo founders

### What incorporation gives you

- Company registration certificate
- EIN / GST / VAT number (tax ID)
- Ability to sign contracts as the company (not personally)
- Limited liability (your personal assets are shielded)
- Ability to open a business bank account

**Do not sign customer contracts as an individual.** If Syncpoint gets sued for a compliance product failure, you lose your house.

## 3. Bank account

### What you need

- A business checking account in the name of the entity
- Same-currency as the majority of your revenue (USD if selling US, INR if India-based, etc.)
- Can receive wire transfers, ACH, and Stripe payouts
- Ideally with an API for automation later

### Recommendations

| Provider | Where | Cost | Notes |
|---|---|---|---|
| **Mercury** | US | Free | Best for Delaware C-Corp + US customers. Fast onboarding via Stripe Atlas |
| **Brex** | US | Free | Same class as Mercury; more focused on cards |
| **Wise Business** | International | Free-ish | Best for multi-currency (USD + INR + EUR + GBP) |
| **HDFC / ICICI current account** | India | Nominal | Standard for Indian Pvt Ltd. Watch FIRC requirements for foreign inflows |
| **Starling / Tide** | UK | Free | Standard for UK Ltd |
| **Revolut Business** | EU | Free tier | Multi-currency, quick setup |

### Recommendation

- If US: **Mercury**. Fastest, cleanest, integrates with Stripe.
- If India selling globally: **HDFC current account + Wise Business** for USD receipts. RBI requires FIRC (Foreign Inward Remittance Certificate) for every foreign payment; Wise handles this automatically.
- If UK: **Starling** or **Tide**, either works.

### First deposit

Move enough personal money in to cover 3 months of expenses. Enough to pay for:
- The VPS ($5/mo)
- Domain ($15/yr)
- Templify/Termly ($10/mo)
- ContractsCounsel one-time ($500)
- Vanta/Drata for own SOC 2 ($400-800/mo — optional)
- Insurance (~$100-200/mo)
- Total: ~$1,000-$2,000 for the first quarter

## 4. Pricing model

Deciding what to charge is a whole discipline. Here's the smallest useful version.

### Common patterns

| Model | Example | Pros | Cons |
|---|---|---|---|
| **Flat monthly** | $1,000/mo for everything | Easy to sell, easy for customer to budget | Hard to expand revenue |
| **Per user** | $50/user/mo | Aligns with growth | Under-monetizes automation value |
| **Per active integration** | $250/mo per connected system (GitHub, AWS, Jira) | Aligns with delivered value | Feels weird if customer only wants 1 |
| **Per framework** | $500/mo per framework (SOC 2 = $500, ISO 27001 = $500) | Simple story | Punishes multi-framework customers |
| **Hybrid** | $500 base + $100/user + $100/integration | Most flexibility | Harder to communicate |

### Recommendation for first paying pilot

**Flat monthly, $1,000-$2,000/mo, unlimited users, up to 3 integrations, SOC 2 only.**

Reasons:
- Simple to negotiate — no debate about seat counts
- Simple to invoice — one line item
- Simple to iterate — you can change the model for customer #4 with data
- Low enough to fit a design partner's expense budget (below the "requires VP approval" line at most companies, typically $2,500/mo)
- High enough to signal "this is a real product" (below $500/mo feels like a hobby)

### Discounts for pilot

- Design partner: 50% off first 6 months in exchange for feedback + logo permission + testimonial
- Annual prepay: 15% off
- Multi-year: 20% off (rarely applicable in year 1)

### What to include in the price

Everything except:
- Custom integrations built specifically for one customer (charge separately or refuse)
- On-site support / training (charge separately)
- White-label / private-label deployment (charge a premium)

## 5. Billing system

### Options

| Approach | Effort | Best for |
|---|---|---|
| **Manual PDF invoice** emailed monthly | 30 min/mo per customer | 1-5 customers |
| **Stripe Invoicing** — auto-generated invoices, payment link, autopay | 2 hours setup | 5-50 customers |
| **Stripe Billing (subscriptions)** — customer signs up on your site, card charged monthly, self-service portal | 2-3 days integration | 50+ customers |
| **Chargebee / Recurly** | 1 week integration + $99/mo | Only when you outgrow Stripe |

### Recommendation for first paying pilot

**Manual PDF invoice for first 1-3 customers.** Reasons:
- No integration work
- You touch every invoice, so you catch pricing mistakes
- Bank transfer / wire is fine; even a personal-check-style ACH works
- Zero risk of automatic charge going wrong on a customer you care about

**Move to Stripe Invoicing at customer #4.** Reasons:
- Manual overhead breaks even
- Stripe Invoicing is free — no monthly cost, only pay per transaction (2.9% + $0.30)
- Autopay reduces AR risk
- Customer gets a nice hosted invoice link

**Move to Stripe Billing when you have a signup form on your site** where customers self-serve without you emailing them anything.

### First invoice mechanics

Google "SaaS invoice template" — download any of the free ones. Fill in:

```
Invoice #                 : 2027-001
Date                      : 2027-01-15
Due                       : 2027-01-30 (Net 15)
Customer                  : Acme Technologies Inc.
Billing address           : ...

Description               Qty    Rate       Amount
─────────────────────────────────────────────────
Syncpoint Compliance      1      $1,500     $1,500
(monthly, Jan 2027)

Subtotal                                    $1,500
Tax (if applicable)                         $0
─────────────────────────────────────────────────
Total due                                   $1,500

Wire to: [bank details]
Or pay online: [Stripe payment link]
```

Send as PDF via email. Follow up if unpaid at day 14. Send friendly reminder at day 20.

## 6. Payment processor

Only relevant once you're using Stripe Invoicing or Billing.

- **Stripe** — the default. Easy, well-documented, works in most countries
- **Razorpay** — India-focused, better for INR-primary businesses
- **PayPal** — avoid. Frequent account freezes.
- **Wire only** — fine for first 1-3 customers; annoying at scale

### Stripe setup

1. Create account at [stripe.com](https://stripe.com)
2. Verify identity (upload passport / driver's license, connect bank)
3. In Test mode: create a product ("Syncpoint Compliance"), create a $1,500/mo price
4. Send yourself a test invoice
5. Once verified, switch to Live mode
6. Cost: 2.9% + $0.30 per successful charge, no monthly fee

Total setup time: ~1 hour if you have the docs ready.

## 7. Insurance

Two policies to consider:

### E&O (Errors & Omissions) insurance

Covers you when a customer sues because the product didn't do what they thought it would (e.g., their audit failed and they blame you).

- Cost: ~$1,200–$2,500/yr for a $1M coverage limit at startup scale
- Providers: Hiscox, Vouch, Embroker, Founder Shield
- Fastest: **Vouch** — designed for startups, online quote in 30 minutes

### Cyber liability insurance

Covers you if you have a data breach — legal costs, notification costs, forensic investigation.

- Cost: ~$800–$2,000/yr for $1M coverage at startup scale
- Same providers as E&O
- Usually bundled with E&O by Vouch/Founder Shield

### Recommendation

**Vouch E&O + Cyber bundle**, $2,000–$4,000/yr. Get the quote in Week 5 of your 10-week plan. Some customers will ask for a Certificate of Insurance (COI) as a contract condition; Vouch generates these on request.

### Do you need it for a design partner (free pilot)?

Technically no. In practice, get it before the first paying invoice. Costs less than a broken deal.

## 8. Accounting

Absolute minimum:

1. **QuickBooks Simple Start** ($15/mo) or **Wave** (free) — track invoices, expenses, income
2. **File**: receipts, invoices, bank statements
3. **Rule**: reconcile every month (30 minutes)
4. **Year-end**: hire a bookkeeper for taxes ($500-$1,500)

Do NOT try to hand-roll accounting in a spreadsheet. Time to reconstruct a year of history for a lawsuit or audit is 10× worse than 15 min/mo.

### Sales tax / VAT / GST

Depending on jurisdiction, you may need to collect and remit tax on invoices:

- **US**: sales tax varies by state; SaaS is taxable in ~20 states. Use **TaxJar** or **Anrok** for automation once you have >5 customers.
- **India**: 18% GST on B2B services. Register once you cross ₹20L annual turnover (or immediately for e-invoicing).
- **UK**: VAT registration required at £85k+ turnover.
- **EU**: VAT via MOSS if selling B2C; B2B invoicing usually reverse-charged.

For your first pilot: check the rule for your jurisdiction. Often you're below the threshold and can skip. Never NOT charge tax if you're required to — you'll owe it out of pocket later.

## 9. The full "first paying pilot" business setup checklist

Ordered by dependency:

| # | Task | Cost | Time |
|---|---|---|---|
| 1 | Decide legal entity type + jurisdiction | Free | 1 hour thinking |
| 2 | Incorporate | $500-1500 | 1-3 weeks |
| 3 | Get EIN / GST / VAT number | Free-Nominal | Included in incorporation |
| 4 | Open business bank account | Free | 1-2 weeks |
| 5 | Deposit first tranche of operating capital | (your money) | 1 day |
| 6 | Decide pricing model | Free | 1 hour + 3 customer conversations |
| 7 | Sign up for Stripe (Live mode) | Free | 1 hour |
| 8 | Get E&O + Cyber insurance quote via Vouch | Free to quote | 1 hour |
| 9 | Actually buy the insurance | $2000-4000/yr | 1 day after quote |
| 10 | Set up QuickBooks or Wave | $0-15/mo | 1 hour |
| 11 | Create your first PDF invoice template | Free | 30 min |
| 12 | Set up DocuSign free tier for signing MSAs | Free | 30 min |

**Total**: $2,500-$5,500 + ~2-3 weeks calendar time.

## 10. When you'll need to revisit

- **Second customer signs**: switch from manual invoicing to Stripe Invoicing
- **Fifth customer signs**: hire a fractional CFO or bookkeeper
- **Year 1 revenue > $50k**: file real tax return with a CPA
- **You raise external capital**: re-do everything with a real law firm and cap table software (Carta / Pulley)
- **You enter a new region**: check tax + banking implications

## 11. What NOT to do

- ❌ Take payment before contract is signed. Ever.
- ❌ Take payment to a personal account "just this once." Blurring legal entity boundaries is how startups get sued through the "corporate veil."
- ❌ Send a customer an invoice for last month while their account is unlimited. Send the invoice at the START of the period, not the end.
- ❌ Give a customer 90-day terms because they asked. 30 days max for first customers. Cash flow kills startups.
- ❌ Discount below $500/mo. Once you're at that price, they'll expect it at renewal. Under-promise on price, over-deliver on features.
- ❌ Try to be perfect on accounting from day 1. Just don't lose receipts and reconcile monthly.

## Summary — the smallest business setup that lets you take money

For your first paying pilot:

1. Delaware LLC or Pvt Ltd (your jurisdiction) — ~$500-$1,500
2. Mercury or Wise business account — free
3. Flat $1,500/mo pricing decided in one afternoon
4. Manual PDF invoice
5. Wire transfer or ACH for payment
6. Vouch E&O + Cyber insurance — $2,000/yr
7. QuickBooks Simple Start — $15/mo
8. DocuSign free tier

**Total upfront**: $2,500-$3,000. **Ongoing**: ~$100/mo.

**Timeline**: 2-3 weeks calendar time for incorporation to clear.
