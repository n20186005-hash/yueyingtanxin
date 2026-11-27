# AGENTS.md — #301 蘭潭月影潭心 (Codex independent worktree)

## Scope and repository
- Site: https://yueyingtanxin.com/
- Repository: https://github.com/n20186005-hash/yueyingtanxin
- Maps location: https://maps.app.goo.gl/TGMYG7zRJhNdXm1q9
- Work only in this repository and branch `codex/301-yueyingtanxin-seo`. Base: `main`. Do not touch other sites or reuse generated content for unrelated attractions.
- Static Astro + Tailwind + TypeScript site on Cloudflare Workers. Never substitute Vercel deployment.

## Baseline (GSC export: 2026-08-26 to 2026-11-25)
- 1,130 impressions, 17 clicks, 1.5% CTR, average position 7.1; one landing page appears in exported page report.
- `蘭潭月影潭心`: 237 impressions / 4 clicks, pos 8.15.
- `月影潭心`: 186 impressions / 0 clicks, pos 7.71.
- `蘭潭月影潭心開放時間`: 47 impressions / 3 clicks, pos 2.70.
- 883 / 1,130 impressions from mobile; 1,098 / 1,130 in Taiwan.
- This is a dated baseline, not current live Search Console. Do not claim that missing GSC pages are unindexed without checking the index report.

## Existing work — inspect before creating anything
`main` already contains `src/pages/index.astro`, `opening-hours.astro`, `water-show.astro`, `transport.astro`, `night-view.astro` and `@astrojs/sitemap`. Do not duplicate these paths or undo the home-page photography, design, navigation, content or assets. The 2026-10-14 commit bf56e2c introduced prior SEO work.

## Priorities, in execution order
1. **Production parity**: check whether these five Astro pages are actually live; verify HTTP status, canonical, title, sitemap-index.xml entries, robots directives, navigation and Cloudflare production commit. Report any inability to access Cloudflare deployment directly without guessing.
2. **Routing/404**: inspect `wrangler.jsonc` and `worker.js`: SPA fallback may return the home page for nonexistent routes. Ensure truly missing paths return real 404s, while /api/weather continues to work. Test the 4 deep links, home, an unknown path, sitemap-index.xml, robots.txt and images.
3. **Mobile/SEO quality**: preserve current tourism UI. Check mobile nav alignment/overflow, responsive gallery and image speed, canonical/meta/OG, schema.org TouristAttraction and breadcrumbs. The same site-wide attraction rating is a Google Maps snapshot 4.2 (4,194), NOT a review value fabricated for every nearby attraction. Keep explicit source/date if displayed.
4. **Information accuracy**: distinguish Moon Heart art installation lighting from separate nearby Lantan Music Fountain schedule. Verify current official sources before hardcoding updated showtimes, bus routes, parking conditions, entrance fees or manager; use specific original source links and evidence dates. Existing generic link to taiwan.net.tw is not a substitute for a claim-specific source. Never invent first-hand visits, photography, quotes, reviews, precise facilities or opening schedules.
5. **Low-impression content**: improve existing real user-intent pages (hours, show, transport, night view), actual names/addresses/map links, cross-links, meaningful information, 3–5 focused FAQs each. Add additional independent nearby pages only when uniquely useful with verified facts and appropriately licensed actual location photos; do not create thin duplicate articles to meet arbitrary counts.
6. **Trust & layout**: remove repetitive '待審核 / 待確認' placeholders and excessive vague disclaimers from visitor-facing content; do not misrepresent uncertainty as certainty. Keep a concise, factual site-wide independent third-party disclaimer in footer and detailed source policy on a dedicated page, without implying municipal endorsement or official ticketing.
7. **Build/deploy and QA**: run `corepack pnpm install --frozen-lockfile`, `corepack pnpm check`, `corepack pnpm build`. Use production's Cloudflare Worker deployment only after verification; do not force-push; record commit SHA, deployed production URL, build/log identifiers and smoke-test results. If deployment connection unavailable, report 'not deployed' rather than claiming success.

## Required final report
- Files changed; before/after highlights; screenshot or URL verification evidence when available.
- Build & typecheck results; HTTP status tests (200 / 404); sitemap/canonical; language/mobile/FAQ verification.
- Commit/PR URLs; Cloudflare deployment status and identifier; blockers.
- GSC numbers reported as historical baselines, never as new results.
- Completion status: complete / partial / blocked. No looped retries: after 2 repeated identical blockers, document and stop.
