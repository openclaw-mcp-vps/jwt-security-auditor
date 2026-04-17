# Build Task: jwt-security-auditor

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: jwt-security-auditor
HEADLINE: Audit JWT implementations for security vulnerabilities
WHAT: Scans your JWT implementation to find security vulnerabilities like weak signing algorithms, missing expiration checks, and improper token validation. Runs automated tests against your auth endpoints and provides a detailed security report with fix recommendations.
WHY: JWT vulnerabilities are everywhere but hard to catch in code review. One misconfigured token can expose your entire user base. Security audits cost $10k+ and take weeks, but most teams need quick validation before shipping.
WHO PAYS: Backend engineers at startups and mid-size companies who implement their own auth. Perfect for teams shipping fast without dedicated security engineers, or before security compliance reviews.
NICHE: security-tools
PRICE: $$15/mo

ARCHITECTURE SPEC:
A Next.js web app that analyzes JWT implementations through endpoint scanning and code analysis. Users upload their auth endpoints or paste JWT tokens for automated security testing, receiving detailed vulnerability reports with actionable fixes.

PLANNED FILES:
- app/page.tsx
- app/scan/page.tsx
- app/report/[id]/page.tsx
- app/api/scan/route.ts
- app/api/analyze-jwt/route.ts
- app/api/webhooks/lemonsqueezy/route.ts
- lib/jwt-analyzer.ts
- lib/security-tests.ts
- lib/report-generator.ts
- lib/lemonsqueezy.ts
- components/scan-form.tsx
- components/vulnerability-report.tsx
- components/pricing-table.tsx

DEPENDENCIES: next, tailwindcss, jsonwebtoken, jose, axios, prisma, @prisma/client, @lemonsqueezy/lemonsqueezy.js, zod, react-hook-form, lucide-react

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Lemon Squeezy checkout overlay for payments
- Landing page that converts: hero, problem, solution, pricing, FAQ
- The actual tool/feature behind a paywall (cookie-based access after purchase)
- Mobile responsive
- SEO meta tags, Open Graph tags
- /api/health endpoint that returns {"status":"ok"}
- NO HEAVY ORMs: Do NOT use Prisma, Drizzle, TypeORM, Sequelize, or Mongoose. If the tool needs persistence, use direct SQL via `pg` (Postgres) or `better-sqlite3` (local), or just filesystem JSON. Reason: these ORMs require schema files and codegen steps that fail on Vercel when misconfigured.
- INTERNAL FILE DISCIPLINE: Every internal import (paths starting with `@/`, `./`, or `../`) MUST refer to a file you actually create in this build. If you write `import { Card } from "@/components/ui/card"`, then `components/ui/card.tsx` MUST exist with a real `export const Card` (or `export default Card`). Before finishing, scan all internal imports and verify every target file exists. Do NOT use shadcn/ui patterns unless you create every component from scratch — easier path: write all UI inline in the page that uses it.
- DEPENDENCY DISCIPLINE: Every package imported in any .ts, .tsx, .js, or .jsx file MUST be
  listed in package.json dependencies (or devDependencies for build-only). Before finishing,
  scan all source files for `import` statements and verify every external package (anything
  not starting with `.` or `@/`) appears in package.json. Common shadcn/ui peers that MUST
  be added if used:
  - lucide-react, clsx, tailwind-merge, class-variance-authority
  - react-hook-form, zod, @hookform/resolvers
  - @radix-ui/* (for any shadcn component)
- After running `npm run build`, if you see "Module not found: Can't resolve 'X'", add 'X'
  to package.json dependencies and re-run npm install + npm run build until it passes.

ENVIRONMENT VARIABLES (create .env.example):
- NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID
- NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID
- LEMON_SQUEEZY_WEBHOOK_SECRET

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.
