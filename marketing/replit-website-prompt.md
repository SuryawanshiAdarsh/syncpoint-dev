# Replit AI Agent Build Prompt — Syncpoint Compliance Marketing Website

> Paste everything below the line into Replit's Agent chat (Replit "Agent" / "Ghostwriter",
> not the app itself) as one message. This builds the **public marketing website only** —
> a completely separate, static, no-backend site from the actual Syncpoint product.

---

## Project brief

Build a modern, fully responsive marketing website for **Syncpoint Compliance**, a B2B SaaS
product that helps startups run their SOC 2 compliance program end-to-end — not just collect
evidence. This is a static front-end only: **no custom backend server, no database.** Use a
static site (plain HTML/CSS/JS, or a lightweight framework like Astro or Vite + vanilla JS if
you prefer — your choice, but no Express/Node API routes and no server-side logic of any kind).
It must be ready to deploy on Replit's static/autoscale hosting and work correctly when served
as static files behind any CDN.

## Before you paste this into Replit — 2-minute setup so demo requests actually reach your inbox

The form needs one real value that only a human can get (it requires an email address to send
the key to): a **Web3Forms access key**.

1. Go to https://web3forms.com/ and enter the email address that should receive every demo
   request (your real inbox — this can be changed later).
2. Click "Create Access Key." Web3Forms emails you a key that looks like
   `a1b2c3d4-e5f6-7890-abcd-ef1234567890` — no account, password, or dashboard login required.
3. Keep that key. After Replit builds the site, find the line
   `value="YOUR_WEB3FORMS_ACCESS_KEY"` in `contact.html` and paste your real key in.
4. Submit the form once yourself after deploying to confirm the email actually arrives (check
   spam the first time). That's the whole setup — no billing, no server, nothing to maintain.

If you'd rather use a different provider (Formspree, Getform), the wiring below is easy to swap
— same idea, different endpoint URL and field names.

### Tech constraints
- Static output only (HTML/CSS/JS). If using a framework (Astro, 11ty, plain Vite), it must
  build to static files — no server runtime required at request time.
- No backend, no API routes, no database, no server-side rendering that requires a live process
  beyond serving static files.
- **The "Request a Demo" form must actually deliver an email to us, with zero backend of our
  own.** Use **Web3Forms** (https://web3forms.com) — it's free, has no submission cap, and
  requires no account/dashboard login, only an access key emailed to whoever owns the inbox
  that should receive demo requests. Wire the form exactly like this (real, working code, not
  a stub):
  ```html
  <form id="demo-form">
    <input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY">
    <input type="hidden" name="subject" value="New demo request — Syncpoint website">
    <input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off">

    <input type="text" name="name" required placeholder="Full name">
    <input type="email" name="email" required placeholder="Work email">
    <input type="text" name="company" required placeholder="Company name">
    <select name="company_size">
      <option>1-10</option><option>11-50</option><option>51-200</option><option>200+</option>
    </select>
    <textarea name="message" placeholder="What are you hoping to solve?"></textarea>

    <button type="submit">Request a demo</button>
    <p id="demo-form-status" role="status"></p>
  </form>
  <script>
    const form = document.getElementById('demo-form');
    const status = document.getElementById('demo-form-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = 'Sending…';
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });
      const result = await res.json();
      if (result.success) {
        form.style.display = 'none';
        status.textContent = "Thanks — we'll reply within one business day.";
      } else {
        status.textContent = 'Something went wrong. Please email us directly instead.';
      }
    });
  </script>
  ```
  Leave `YOUR_WEB3FORMS_ACCESS_KEY` as a clearly marked `TODO` — see the setup steps below for
  exactly how to get the real key. Also add a `mailto:hello@YOURDOMAIN.com` fallback link next
  to the form for anyone whose browser blocks the request (`TODO: replace YOURDOMAIN.com`).
- Fully responsive: mobile-first, works cleanly from 360px phone width up to 1920px desktop.
  No horizontal scroll at any breakpoint. Test at 360/768/1024/1440.
- Accessible: semantic HTML5 landmarks, proper heading hierarchy (one `<h1>` per page), alt
  text on every image, visible focus states, color contrast passing WCAG AA, keyboard-navigable
  nav and form.
- Fast and deploy-ready: optimized images (SVG for icons/logo), no render-blocking webfonts
  (use `font-display: swap` or system fonts), a real `favicon.ico`/`favicon.svg`, `robots.txt`,
  `sitemap.xml`, and Open Graph + Twitter Card meta tags (title, description, og:image) on every
  page so links preview correctly when shared.
- Multi-page site (not a single long scroll): Home, Product, Pricing, Security, About, Contact/
  Demo. Shared header nav + footer across all pages. See sitemap below.

### Visual design system (match the real product's identity — do not invent a different brand)

These are the **exact, real design tokens from the actual product's stylesheet**. Use these
values verbatim — do not approximate or pick similar-looking colors.

- **Brand name**: Syncpoint Compliance (short form: "Syncpoint")

**Logo — use this exact SVG file, do not redesign it.** Save as `/assets/logo.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="syncpointGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#syncpointGradient)"/>
  <path d="M9 20 L16 8 L23 20 L19 20 L16 14 L13 20 Z" fill="#ffffff"/>
</svg>
```
Use this same file (scaled via CSS/HTML `width`/`height`, never redrawn) for: the header logo,
the footer logo, and `favicon.svg`. For `favicon.ico`/apple-touch-icon, export this SVG at
32×32, 180×180, and 512×512 — same artwork, no redesign.

**Color tokens** (copy these into a single `:root { }` block in `styles.css` and use the
variables everywhere — never hardcode a hex value in a component):
```css
:root {
  /* Brand */
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-active: #4338ca;
  --color-primary-soft: #eef2ff;
  --color-primary-text: #4338ca;
  --color-accent: #8b5cf6; /* violet, used in gradients paired with --color-primary */

  /* Surfaces (light pages: Product, Pricing, Security, About, Contact) */
  --color-bg: #f5f7fb;
  --color-surface: #ffffff;
  --color-surface-muted: #f8fafc;
  --color-border: #e5e9f0;
  --color-border-strong: #cbd5e1;
  --color-divider: #eef1f5;

  /* Text (on light surfaces) */
  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;

  /* Text (on the dark hero / footer) */
  --color-text-on-dark: #ffffff;
  --color-text-on-dark-body: #cbd5e1;
  --color-text-on-dark-muted: #94a3b8;

  /* Dark hero / footer background gradient */
  --gradient-hero: linear-gradient(135deg, #0b1220 0%, #1e1b4b 55%, #4c1d95 100%);
  --gradient-brand: linear-gradient(135deg, #6366f1, #8b5cf6);

  /* Semantic (used sparingly — small status chips only) */
  --color-success: #10b981; --color-success-soft: #ecfdf5; --color-success-border: #a7f3d0; --color-success-text: #047857;
  --color-warning: #f59e0b; --color-warning-soft: #fffbeb; --color-warning-border: #fde68a; --color-warning-text: #b45309;
  --color-danger:  #ef4444; --color-danger-soft:  #fef2f2; --color-danger-border:  #fecaca; --color-danger-text:  #b91c1c;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', sans-serif;

  /* Radii — this product uses noticeably rounded corners everywhere */
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;
}
```

**Icons — use Google's classic Material Icons font (same icon set the real product uses),
not a different icon library.** Load it via:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
```
Usage: `<span class="material-icons">rocket_launch</span>` (styled with `font-size`/`color`
via CSS, same as any inline icon). Use exactly these icon names for these exact purposes —
do not substitute similar-looking icons:

| Icon name (`material-icons` ligature) | Use for |
|---|---|
| `rocket_launch` | Guided SOC 2 kickoff feature |
| `verified_user` | Risk register (CC3) feature, and the Security page hero |
| `bolt` | Continuous evidence automation feature |
| `psychology` | AI-assisted mapping, human-confirmed feature |
| `gavel` | Policy management feature |
| `fact_check` | Auditor-ready readiness report feature |
| `checklist` | General "controls/coverage" decoration (feature grid, pipeline diagram) |
| `description` | Evidence/documents references |
| `lock` | Encrypted secrets bullet on the Security page |
| `history` | Audit log / permanent record references |
| `hub` | Integrations (GitHub/AWS/Jira) references |
| `check_circle` | Success states, form thank-you message |
| `error_outline` | Form error state |
| `arrow_back` / `expand_more` | Nav/back links, accordion chevrons (Pricing FAQ) |
| `menu` / `close` | Mobile hamburger nav open/close |

- **Shape language**: large rounded corners (`--radius-lg`/`--radius-xl` = 12–16px) on cards and
  buttons, soft shadows, subtle radial-gradient glows in hero sections (like aurora/spotlight
  effects — see the `--gradient-hero` token), pill-shaped badges (`--radius-full`).
- **Tone**: confident but honest. No hype-speak like "AI-powered magic" or "100% compliant
  guaranteed." This product's whole positioning is that AI suggests and humans confirm — lean
  into that as a trust differentiator, not something to hide.

---

## Sitemap & page-by-page content

### 1. Home (`/`)

**Hero section** (dark gradient background):
- Eyebrow label: "SOC 2 compliance, done right"
- H1: "The complete path to a real **SOC 2 report** — not just an evidence inbox."
- Subhead: "Syncpoint runs your whole compliance program: scope and kickoff, risk assessment,
  policies, continuous evidence collection, and an auditor-ready readiness report — all in one
  place, built for engineering-led teams doing their first SOC 2 audit."
- Two CTAs: primary button "Request a demo" (scrolls/links to `/contact`), secondary ghost
  button "See how it works" (anchor link down the page).
- Small trust strip under the buttons: 3 short bullet chips — "Human-in-the-loop AI", "Multi-
  tenant, encrypted by design", "Runs in your cloud or ours."

**"The problem" section** (light background, two columns):
- Left: short narrative — traditional SOC 2 prep takes 3–6 months of Slack messages, screenshot
  hunting, and spreadsheets that go stale before the audit even starts.
- Right: a simple 5-step visual pipeline diagram: **Connect → Collect → Map → Review → Export**,
  each step with a one-line caption (mirrors the real product's evidence pipeline).

**"What Syncpoint actually does" — feature grid** (3×2 cards, icon + title + 2-sentence body):
1. **Guided SOC 2 kickoff** — Trust Services Category scoping, Type I vs Type II selection with
   observation-period tracking, and a structured system-description builder — done in a guided
   flow, not a blank onboarding tour.
2. **Risk register (CC3)** — Score risks by likelihood × impact, assign owners, link them to the
   controls that mitigate them, and track remediation status — the risk assessment every SOC 2
   report requires.
3. **Continuous evidence automation** — Deterministic collectors for GitHub, AWS, and Jira pull
   real evidence on a schedule. No AI guessing at facts an API can just tell us.
4. **AI-assisted mapping, human-confirmed** — AI proposes which control a piece of evidence
   supports, with cited reasoning. A human reviewer always makes the final call — every
   suggestion and every confirmation is permanently logged.
5. **Policy management** — Upload, version, and track staff acknowledgment of every required
   policy, mapped directly to the controls they support.
6. **Auditor-ready readiness report** — One document: coverage percentage, open gaps, the full
   risk register, and any logged control exceptions — the artifact you actually hand your CPA
   firm to start scoping.

**"Built on honesty" section** (dark or contrasting band):
- A short callout: "Every AI suggestion is labeled AI_SUGGESTED until a human confirms it.
  Nothing in your audit trail pretends a human didn't make the final call." This is the single
  biggest differentiator vs. competitors selling an opaque "trust score" — make it prominent.

**CTA band** (bottom of page): "See it on your own systems" + Request a demo button.

### 2. Product (`/product`)

Deeper dive on each feature from the home page grid, one section per feature, alternating
image-left/text-right layout (use simple abstract SVG illustrations or styled mock UI cards —
do not fabricate screenshots of a real dashboard unless told). Include the same 5-step pipeline
diagram again near the top with more detail per stage.

### 3. Pricing (`/pricing`)

Do **not** publish specific dollar figures (the company is pre-launch and pricing is still
being validated with design partners). Instead:
- Three simple tiers by name only, mirroring the product's real plan names: **Starter**,
  **Pro**, **Enterprise** — each with a bullet list of what's included (integrations count,
  users, frameworks) and a "Contact us" / "Request a demo" button instead of a price.
- One line under the tiers: "Every plan starts with a guided pilot — talk to us about your
  timeline."
- Small FAQ accordion below: "How long does setup take?", "Do you support Type II?", "Is our
  data encrypted?", "Can this run inside our own cloud account?" — answer honestly and briefly
  based on the real product (multi-tenant SaaS by default; a single-container self-hosted
  "appliance" option exists for customers who don't want their cloud credentials leaving their
  network).

### 4. Security (`/security`)

A dedicated trust page (every serious B2B buyer looks for this before a demo call):
- Multi-tenant isolation — every tenant-scoped query is filtered by organization ID.
- Encrypted secrets at rest — envelope encryption for stored credentials (AWS/GitHub/Jira
  tokens), never stored in plaintext.
- Role-based access control — Owner / Admin / Reviewer / Viewer, least-privilege by design.
- Full audit log — every action, every AI suggestion, every human confirmation, permanently
  recorded.
- **Honesty clause, verbatim, do not soften**: "Syncpoint helps you prepare for and maintain a
  SOC 2 report. Using Syncpoint does not itself make your company SOC 2 compliant, and Syncpoint
  is not currently SOC 2 certified. We'll update this page the moment that changes." — this must
  appear on the page, not buried in a footer link. Do not claim any certification, badge, or
  "SOC 2 Type II compliant" status anywhere on the site.

### 5. About (`/about`)

- Short founding story placeholder (2–3 paragraphs, generic and honest: "we watched engineering
  teams burn a quarter on SOC 2 evidence-wrangling and built the tool we wished existed").
  Mark clearly with an HTML comment `<!-- TODO: replace with real founder story -->`.
- Do **not** invent team member names, headshots, investor logos, or press mentions. Leave a
  clearly commented placeholder section instead: `<!-- TODO: add team photos/bios once ready -->`.

### 6. Contact / Request a Demo (`/contact`)

This is the conversion page. Keep it simple:
- Form fields: Full name (required), Work email (required), Company name (required), Company
  size (dropdown: 1-10 / 11-50 / 51-200 / 200+), What are you hoping to solve? (textarea,
  optional).
- Submit button: "Request a demo".
- On success: replace the form with a thank-you message ("Thanks — we'll reply within one
  business day.") without a page reload (client-side fetch to the form service, show/hide via
  JS).
- On error: inline error message, do not lose the user's typed input.
- Beside/below the form: `mailto:hello@YOURDOMAIN.com` (`TODO: replace with the real domain`)
  and a note "Prefer email? Reach us
  directly." Also fine to add a placeholder Calendly-style "Book a time" link
  (`<!-- TODO: replace with real scheduling link -->`) if you want a second CTA path.

---

## Shared header & footer

**Header** (sticky, same on every page): logo + wordmark on the left, nav links (Product,
Pricing, Security, About) center/right, "Request a demo" button styled as a solid primary
pill on the far right. Collapse into a hamburger menu below 768px.

**Footer** (every page): 4 columns —
1. Logo + one-line tagline + `© 2026 Syncpoint Compliance. All rights reserved.`
2. Product column: links to Product, Pricing, Security
3. Company column: links to About, Contact
4. Legal column: **Privacy Policy**, **Terms of Service**, **Security** — link these to
   `/privacy.html` and `/terms.html` placeholder pages containing a clearly marked
   `<!-- TODO: replace with real legal text drafted by counsel — see LEGAL.md -->` comment and a
   short honest placeholder paragraph ("This is placeholder legal text. Do not rely on this
   page as a real privacy policy or terms of service until reviewed by counsel."). Do **not**
   write real legal terms yourselves — that's a legal-review task, not a copywriting one.

---

## Guardrails — do not violate these

1. **No fabricated social proof.** Do not invent customer logos, testimonial quotes, star
   ratings, "trusted by 500 companies," or press-mention badges. If you want a social-proof
   section, make it an honest, clearly-commented placeholder (`<!-- TODO: add real customer
   logos once we have paying customers -->`) rather than fake content.
2. **No fabricated certifications.** Never state or imply Syncpoint itself holds a SOC 2 report,
   ISO 27001 certification, or any compliance badge it does not actually have. The Security page
   language above is mandatory, not optional.
3. **No invented pricing numbers** unless you (the human reading this) explicitly provide them
   later — ship the Pricing page with tier names and feature lists only.
4. **No backend.** If Replit's agent defaults to scaffolding an Express server or a database,
   stop and rebuild as static output. The only external network call this site ever makes is the
   client-side POST to the demo-request form service.
5. Keep all copy honest about the AI: it suggests, a human confirms, nothing more.
6. **Zero connection to the live product, of any kind.** This is a standalone informational/
   marketing website only. Do not add a "Sign in" / "Log in" link, do not link or redirect to
   any app subdomain, do not embed the product in an iframe, and do not call any API belonging
   to the real Syncpoint application. The only outbound network call anywhere on this site is
   the demo-request form's POST to the third-party form service (Formspree/Web3Forms/etc). If
   a visitor wants to reach the product, that's handled outside this project entirely — not
   this site's job.

---

## Suggested folder structure

```
/
├── index.html
├── product.html
├── pricing.html
├── security.html
├── about.html
├── contact.html
├── privacy.html
├── terms.html
├── robots.txt
├── sitemap.xml
├── favicon.svg
├── /assets
│   ├── logo.svg
│   ├── /images        (any illustrations/diagrams as SVG)
│   └── /css
│       └── styles.css
└── /js
    └── main.js         (nav toggle, form submit handler, accordion, smooth-scroll)
```

Plain HTML/CSS/JS (no build step) is perfectly fine and preferred for fastest Replit deploy —
only reach for Astro/Vite if you want component reuse across the 7 pages; either is acceptable
as long as the final output is static files.
