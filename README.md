# EvoRupa - Srpska Infrastrukturna Platforma

Aplikacija za prijavu problema na putevima i infrastrukturi u Srbiji. Građani mogu fotografisati i mapirati probleme, a lokalne vlasti i zastupnici mogu da ih obrađuju.

## 🚀 Verzija
v0.1.0 - Alpha

## 📋 Karakteristike

- ✅ PWA aplikacija (radi offline)
- ✅ Mapa sa problemima
- ✅ Prijava novih problema sa fotografijom
- ✅ Supabase integacija
- ✅ Real-time ažuriranja
- ✅ Admin panel
- ✅ Autentifikacija

## 🛠️ Tehnologije

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Maps**: Leaflet (OSM) ili Mapbox
- **PWA**: next-pwa
- **State**: Zustand
- **Hosting**: Cloudflare Pages (advanced mode via OpenNext)

## ⚙️ Setup

### Preduslov
- Node.js 18+
- npm/yarn
- Supabase account

### 1. Kloniranje repozitorijuma
```bash
git clone https://github.com/yourusername/evorupa.git
cd evorupa
```

### 2. Instalacija zavisnosti
```bash
npm install
```

### 3. Konfiguracija Supabase
1. Idi na https://supabase.com i kreiraj nov projekat
2. Preuzmi `SUPABASE_URL` i `SUPABASE_PUBLISHABLE_KEY` iz projekta
3. Kreiraj `.env.local` na osnovu `.env.example`:
```bash
cp .env.example .env.local
```
4. Dodaj tvoje Supabase ključeve:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 4. Postavljanje baze podataka
Pogledaj `SETUP_DATABASE.md` za SQL skripte

### 5. Pokretanje aplikacije
```bash
npm run dev
```
Otvori http://localhost:3000

## 📁 Struktura projekta

```
evorupa/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout sa PWA konfiguracijom
│   ├── page.tsx           # Početna strana
│   ├── map/               # Mapa stranica
│   ├── report/            # Prijava problema
│   └── admin/             # Admin panel
├── lib/                    # Utility funkcije
│   ├── supabase.ts        # Supabase klijent
│   └── store.ts           # Zustand store
├── public/                 # Statički fajlovi
│   └── manifest.json      # PWA manifest
├── components/            # Reusable React komponente
├── package.json           # Zavisnosti
└── tsconfig.json          # TypeScript konfiguracija
```

## 🗄️ Baza podataka

### Tabele:
- `users` - Korisnici aplikacije
- `reports` - Prijave problema
- `statuses` - Status prijava
- `categories` - Kategorije problema

Vidi `SETUP_DATABASE.md` za detaljnu dokumentaciju

## 🔐 Sigurnost

- Row-level security (RLS) u Supabase
- Email verifikacija
- Role-based access control (RBAC)
- HTTPS samo

## 📱 PWA Funkcionalnosti

- Offline mode - aplikacija radi bez interneta
- Installable - može se instalirati kao app
- Push notifications - obaveštenja o ažuriranjima
- Background sync - sync slike kada se vrati internet

## 🚢 Deployment

### Cloudflare Pages via OpenNext advanced mode (recommended)
1. Dodaj secrets u GitHub repozitorijum:
	- CLOUDFLARE_ACCOUNT_ID
	- CLOUDFLARE_API_TOKEN
2. Za lokalni ručni deploy proveri Wrangler pristup:
```bash
npx wrangler login
npx wrangler whoami
```
3. Ako koristiš lokalni helper za sync secrets, napravi `.env.cloudflare.local` sa:
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```
2. Opcija za automatski sync iz lokalnog env fajla:
```bash
npm run sync:cf:secrets
```
4. Push na `main` ili `master` branch
5. GitHub Actions workflow treba da validira build, a Cloudflare Pages Git integration ili lokalni Pages deploy objavljuje sajt

Napomena o pristupu:

- automatski Cloudflare Pages build sa GitHub-a ne koristi lokalni `wrangler login`
- lokalni `npm run deploy:pages` i `npm run deploy:worker` koriste Wrangler autentifikaciju ili token-based pristup

Lokalni build za Cloudflare Pages:
```bash
npm run build:pages
```

Lokalni preview Cloudflare Pages build-a:
```bash
npm run preview:pages
```

Lokalni deploy za Cloudflare Pages:
```bash
npm run deploy:pages
```

Direktan Workers deploy ostaje kao fallback:
```bash
npm run deploy:worker
```

Napomena:
Cloudflare Pages ostaje primarni hosting model. OpenNext i dalje generiše `_worker.js` zato što aplikacija ima dinamičke rute, ali se taj worker objavljuje kroz Pages advanced mode, ne kao zaseban Workers-only proizvod.

### Vercel
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t evorupa .
docker run -p 3000:3000 evorupa
```

## 📚 Dokumentacija

- [Agent operating notes](./AGENTS.md)
- [Setup baze podataka](./SETUP_DATABASE.md)
- [Plan razvoja](./DEVELOPMENT_PLAN.md)
- [Početni setup](./GETTING_STARTED.md)
- [Sažetak projekta](./PROJECT_SUMMARY.md)
- [Supabase integracija](./SUPABASE_INTEGRATION.md)
- [Cloudflare hosting](./CLOUDFLARE_HOSTING.md)
- [Chat handoff](./CHAT_HANDOFF.md)
- [Supabase dokumentacija](https://supabase.com/docs)
- [Next.js dokumentacija](https://nextjs.org/docs)

## 🤝 Doprinošenje

Dobrodošli su svi doprinosi! 

Za bagove i konkretne predloge koristi GitHub Issues:
- https://github.com/mmilosevic14/evorupa/issues

Za pitanja, ideje i širu diskusiju koristi GitHub Discussions:
- https://github.com/mmilosevic14/evorupa/discussions

1. Fork projekta
2. Kreiraj feature branch (`git checkout -b feature/nova-funkcionalnost`)
3. Commit promene (`git commit -m 'Dodaj novu funkcionalnost'`)
4. Push u branch (`git push origin feature/nova-funkcionalnost`)
5. Otvori Pull Request

## 📝 Licenca

MIT License - Slobodno koristi kod

## 📞 Kontakt

Za pitanja, povratne informacije i učešće u razvoju koristi GitHub kanale:

- Issues: https://github.com/mmilosevic14/evorupa/issues
- Discussions: https://github.com/mmilosevic14/evorupa/discussions

## 🙏 Hvala

Inspirisano aplikacijom iz Rusije za prijavu infrastrukturnih problema.
