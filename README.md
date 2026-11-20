# BrainoDad website

Lightweight Astro marketing website for BrainoDad, hosted on Railway.

## Local development

```bash
npm ci
npm run dev
```

Open the URL printed by Astro (normally http://localhost:4321).

## Production build

```bash
npm run build
npm run preview
```

## Deployment and safety

- `main` deploys to the production Astro service for `brainodad.com`.
- Build and visually review changes from a feature branch and PR before merging.
- Production has two custom domains: `brainodad.com` and `www.brainodad.com`.
- Do not change Cloudflare or Bluehost mail DNS records for a homepage content update.
- The homepage contact action opens an email to `aravind@brainodad.com`.
- Payment/checkout, analytics, testimonials, and live class schedules are **not** connected in the first draft.

## Homepage contents

- `src/pages/index.astro` — landing page content and styles
- `src/layouts/Layout.astro` — page metadata and HTML layout
- `public/favicon.svg` — branded mark

## Review checklist

1. Confirm `npm run build` passes.
2. Check desktop and narrow mobile layouts in the preview.
3. Check hero, navigation, program cards, and enquiry link.
4. Confirm all brand, offer, and credential wording.
5. Merge and release only with separate owner approval.
