# GDeRupa - Srpska Infrastrukturna Platforma

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
- **Hosting**: Cloudflare Pages + Workers

## ⚙️ Setup

### Preduslov
- Node.js 18+
- npm/yarn
- Supabase account

### 1. Kloniranje repozitorijuma
```bash
git clone https://github.com/yourusername/gderupa.git
cd gderupa
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
gderupa/
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

### Cloudflare Pages + Workers (recommended)
1. Dodaj secrets u GitHub repozitorijum:
	- CLOUDFLARE_ACCOUNT_ID
	- CLOUDFLARE_API_TOKEN
2. Opcija za automatski sync iz lokalnog env fajla:
```bash
npm run sync:cf:secrets
```
3. Push na `main` ili `master` branch
4. GitHub Actions workflow automatski radi build i deploy na Cloudflare Pages

Lokalni build za Cloudflare:
```bash
npm run build:cf
```

Lokalni deploy za Cloudflare:
```bash
npm run deploy:cf
```

### Vercel
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t gderupa .
docker run -p 3000:3000 gderupa
```

## 📚 Dokumentacija

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

1. Fork projekta
2. Kreiraj feature branch (`git checkout -b feature/nova-funkcionalnost`)
3. Commit promene (`git commit -m 'Dodaj novu funkcionalnost'`)
4. Push u branch (`git push origin feature/nova-funkcionalnost`)
5. Otvori Pull Request

## 📝 Licenca

MIT License - Slobodno koristi kod

## 📞 Kontakt

Za pitanja, otvori GitHub issue ili nas kontaktiraj na: dev@gderupa.rs

## 🙏 Hvala

Inspirisano aplikacijom iz Rusije za prijavu infrastrukturnih problema.
