#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  South Wagga Warriors FC — Deploy Script
#  Run on your EmuTel server: bash deploy.sh
# ═══════════════════════════════════════════════════════════
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BOLD}${GREEN}"
echo "  ⚽ South Wagga Warriors FC — Deploy"
echo "════════════════════════════════════${NC}"
echo ""

# ── CHECK REQUIREMENTS ───────────────────────────────────────
echo -e "${BOLD}Checking requirements...${NC}"

command -v docker      >/dev/null 2>&1 || { echo -e "${RED}✗ Docker not found. Install: https://docs.docker.com/engine/install/${NC}"; exit 1; }
command -v docker compose >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}✗ Docker Compose not found.${NC}"; exit 1; }

echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"

# ── CHECK ENV ────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo ""
  echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
  cp .env.example .env
  echo ""
  echo -e "${RED}⚠ STOP — you must edit .env before continuing.${NC}"
  echo ""
  echo "  Required fields to fill in:"
  echo "    POSTGRES_PASSWORD     — choose a strong password"
  echo "    DIRECTUS_SECRET       — random 64-char string (run: openssl rand -hex 32)"
  echo "    DIRECTUS_ADMIN_EMAIL  — your email"
  echo "    DIRECTUS_ADMIN_PASSWORD — choose a strong password"
  echo ""
  echo "  Then re-run: bash deploy.sh"
  echo ""
  exit 1
fi

# Verify required vars are set
source .env
REQUIRED=("POSTGRES_PASSWORD" "DIRECTUS_SECRET" "DIRECTUS_ADMIN_PASSWORD")
for var in "${REQUIRED[@]}"; do
  if [ -z "${!var}" ] || [ "${!var}" = "change_me_strong_password" ] || [ "${!var}" = "change_me_random_64_char_string" ] || [ "${!var}" = "change_me_admin_password" ]; then
    echo -e "${RED}✗ $var is not set or still has placeholder value in .env${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✓ .env configured${NC}"

# ── SSL CERTS ────────────────────────────────────────────────
echo ""
echo -e "${BOLD}SSL Certificate setup...${NC}"

if [ ! -f nginx/certs/southwagga.com.au.crt ]; then
  echo -e "${YELLOW}No SSL certs found. Options:${NC}"
  echo ""
  echo "  1) Use Let's Encrypt (recommended for production):"
  echo "     certbot certonly --standalone -d southwagga.com.au -d www.southwagga.com.au"
  echo "     certbot certonly --standalone -d admin.southwagga.com.au"
  echo "     Then copy certs to nginx/certs/"
  echo ""
  echo "  2) Self-signed for testing (not for production):"
  read -p "  Generate self-signed certs for testing? [y/N] " gen_self
  if [[ "$gen_self" =~ ^[Yy]$ ]]; then
    mkdir -p nginx/certs
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout nginx/certs/southwagga.com.au.key \
      -out    nginx/certs/southwagga.com.au.crt \
      -subj   "/CN=southwagga.com.au"
    cp nginx/certs/southwagga.com.au.key nginx/certs/admin.southwagga.com.au.key
    cp nginx/certs/southwagga.com.au.crt nginx/certs/admin.southwagga.com.au.crt
    echo -e "${GREEN}✓ Self-signed certs generated${NC}"
  else
    echo -e "${YELLOW}⚠ Skipping SSL — site will only run on HTTP for now${NC}"
  fi
else
  echo -e "${GREEN}✓ SSL certs found${NC}"
fi

# ── BUILD & START ────────────────────────────────────────────
echo ""
echo -e "${BOLD}Building and starting containers...${NC}"
echo "(This may take a few minutes on first run)"
echo ""

docker compose pull
docker compose build
docker compose up -d

echo ""
echo -e "${BOLD}Waiting for services to start...${NC}"
sleep 8

# ── APPLY DIRECTUS SCHEMA ────────────────────────────────────
echo ""
echo -e "${BOLD}Applying Directus schema...${NC}"

# Wait for Directus to be ready
RETRIES=0
until docker compose exec -T directus wget -q -O- http://localhost:8055/server/health | grep -q '"status":"ok"' 2>/dev/null; do
  RETRIES=$((RETRIES+1))
  if [ $RETRIES -gt 20 ]; then
    echo -e "${YELLOW}⚠ Directus taking longer than expected. Apply schema manually (see README).${NC}"
    break
  fi
  echo "  Waiting for Directus... ($RETRIES/20)"
  sleep 5
done

if [ $RETRIES -le 20 ]; then
  docker compose exec -T directus npx directus schema apply --yes /directus/schema/schema.json 2>/dev/null \
    && echo -e "${GREEN}✓ Schema applied${NC}" \
    || echo -e "${YELLOW}⚠ Schema apply failed — run manually: docker compose exec directus npx directus schema apply --yes /directus/schema/schema.json${NC}"
fi

# ── GENERATE DIRECTUS STATIC TOKEN ───────────────────────────
echo ""
echo -e "${BOLD}Checking Directus static token...${NC}"
source .env
if [ -z "$DIRECTUS_STATIC_TOKEN" ]; then
  echo -e "${YELLOW}No DIRECTUS_STATIC_TOKEN set.${NC}"
  echo "  After the site is running:"
  echo "  1. Log in to admin.southwagga.com.au"
  echo "  2. Go to Settings → Users → Admin user → Token"
  echo "  3. Generate a token and add it to .env as DIRECTUS_STATIC_TOKEN"
  echo "  4. Run: docker compose restart astro"
fi

# ── SEED DEFAULT DATA ─────────────────────────────────────────
echo ""
echo -e "${BOLD}Seeding default team data...${NC}"
docker compose exec -T directus node -e "
const { createDirectus, rest, authentication, createItems } = require('@directus/sdk');
const client = createDirectus('http://localhost:8055').with(rest()).with(authentication());
async function seed() {
  await client.login('${DIRECTUS_ADMIN_EMAIL}', '${DIRECTUS_ADMIN_PASSWORD}');
  const teams = [
    { name: \"Men's Premier League\",  short_name: \"Men's Premier\", slug: 'mens-premier',  division: \"Men's Premier League\",  sort_order: 1, season: '2025', status: 'active' },
    { name: \"Women's Division 1\",    short_name: \"Women's D1\",    slug: 'womens-d1',     division: \"Women's Division 1\",    sort_order: 2, season: '2025', status: 'active' },
    { name: 'Under 18',               short_name: 'U18',            slug: 'u18',            division: 'Under 18',               sort_order: 3, season: '2025', status: 'active' },
    { name: 'Under 16',               short_name: 'U16',            slug: 'u16',            division: 'Under 16',               sort_order: 4, season: '2025', status: 'active' },
    { name: 'Under 14',               short_name: 'U14',            slug: 'u14',            division: 'Under 14',               sort_order: 5, season: '2025', status: 'active' },
    { name: 'Under 12',               short_name: 'U12',            slug: 'u12',            division: 'Under 12',               sort_order: 6, season: '2025', status: 'active' },
    { name: 'Mini Roos',              short_name: 'Mini Roos',      slug: 'mini-roos',      division: 'Mini Roos',              sort_order: 7, season: '2025', status: 'active' },
    { name: 'Twilight League',        short_name: 'Twilight',       slug: 'twilight',       division: 'Twilight League',        sort_order: 8, season: '2025', status: 'active' },
  ];
  await createItems(client, 'teams', teams);
  console.log('Teams seeded.');
}
seed().catch(e => console.log('Seed skipped (already exists):', e.message));
" 2>/dev/null && echo -e "${GREEN}✓ Default teams created${NC}" || echo -e "${YELLOW}⚠ Team seed skipped (may already exist)${NC}"

# ── STATUS ────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════"
echo -e "${BOLD}${GREEN}  ✓ Deploy complete!${NC}"
echo "════════════════════════════════════"
echo ""
echo -e "${BOLD}Services running:${NC}"
docker compose ps
echo ""
echo -e "${BOLD}Access your site:${NC}"
echo "  🌐 Public site:   https://southwagga.com.au"
echo "  ⚙  Admin CMS:     https://admin.southwagga.com.au"
echo "  ⚡ n8n workflows:  https://n8n.southwagga.com.au"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo "  1. Log in to admin CMS and set your site settings"
echo "  2. Add a Directus static token to .env (see above)"
echo "  3. Run Dribl discovery: docker compose exec scraper node scraper.js --discover"
echo "  4. Set up n8n social automation workflows"
echo "  5. Configure Square checkout links for shop/academy items"
echo ""
echo -e "  📖 Full docs: see ${BOLD}README.md${NC}"
