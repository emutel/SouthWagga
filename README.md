# South Wagga Warriors FC — Website

Full-stack club website: Directus CMS + Astro static site + Dribl scraper + n8n social automation.

## Quick Deploy

```bash
# 1. Clone / upload this folder to your EmuTel server
# 2. Copy and configure environment
cp .env.example .env
nano .env   # fill in all values

# 3. Deploy
chmod +x deploy.sh
bash deploy.sh
```

## Architecture

- **Directus** — headless CMS at admin.southwagga.com.au
- **Astro** — static site builder, rebuilds on every content save
- **nginx** — serves the static site publicly
- **Dribl scraper** — pulls results/fixtures from fww.dribl.com on cron
- **n8n** — auto-posts news articles to Facebook & Instagram
- **Square** — handles all payments (embedded checkout links)

## Pages Built

- `/` — Homepage with hero, results, fixtures, news, academy CTA, Instagram feed
- `/results` — Full results, fixtures & league tables (Dribl synced)
- `/teams` — All teams listing
- `/teams/[slug]` — Individual team: squad, results, fixtures, team sponsors
- `/news` — News article list
- `/news/[slug]` — Individual article with social share buttons
- `/academy` — Academy programs with Square enrolment
- `/shop` — Merchandise with Square checkout
- `/events` — Events & tickets with Square payment
- `/gallery` — Photo album grid
- `/gallery/[id]` — Album with lightbox
- `/about` — Club info, ground map, contact form, sponsors

## After Deploy

1. Log in to Directus admin and set Site Settings (contact details, social URLs)
2. Generate a static API token in Directus → Users → Admin → Token
3. Add token to .env as DIRECTUS_STATIC_TOKEN, then: docker compose restart astro
4. Run Dribl discovery: docker compose exec scraper node scraper.js --discover
5. Set DRIBL_CLUB_ID in .env, then: docker compose restart scraper
6. Configure n8n social workflows at n8n.southwagga.com.au
7. Add Square checkout URLs to shop items, academy programs, events in Directus

## Admin Guide

Open ADMIN-GUIDE.html in a browser — print it for club volunteers.
