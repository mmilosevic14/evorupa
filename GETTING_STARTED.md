# GDeRupa - Početni Setup Vodič

## 🎯 Šta treba da uradiš?

Evo korak-po-korak instrukcija za pokretanje projekta:

## Korak 1: Kreiraj Supabase Account

1. Idi na https://supabase.com
2. Klikni "Sign up with GitHub" ili kreiraj nalog
3. Kreiraj nov projekat:
   - Naziv: `gderupa` (ili bilo koji)
   - Region: EU - Frankfurt (preporuka za Srbiju)
   - Database password: Zapamti ga!
4. Čekaj 2-3 minuta da se kreira

## Korak 2: Preuzmi Supabase Kredencijale

1. U Supabase dashboard, idi na: **Settings → API**
2. Kopira sledeće vrednosti:
   - **Project URL** (npr: `https://xxxxx.supabase.co`)
   - **anon public** key (dugi ključ koji počinje sa `eyJ...`)

## Korak 3: Postavi Supabase Bazu Podataka

1. U Supabase dashboard, idi na: **SQL Editor**
2. Otvori novi query i kopira ceo SQL kod iz `SETUP_DATABASE.md`
3. Uradi **Run** ili Ctrl+Enter
4. Proveri da nema greške

## Korak 4: Kreiraj `.env.local` fajl

1. U direktorijumu `gderupa/`, kreiraj fajl `.env.local`
2. Kopira ovo (zameni sa tvojim vrednostima):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxx
```

**Gde da nađeš vrednosti:**
- `SUPABASE_URL`: Settings → API → Project URL
- `SUPABASE_ANON_KEY`: Settings → API → anon public

## Korak 5: Instaliraj NPM zavisnosti

```bash
cd gderupa
npm install
```

**Napomena:** Ako ima greške sa SSL sertifikatom:
```bash
npm config set strict-ssl false
npm install
```

## Korak 6: Pokretanje aplikacije

```bash
npm run dev
```

Otvori http://localhost:3000 u pretraživaču.

Trebalo bi da vidiš landing page sa glavnom navigacijom.

## Korak 7: Testiraj Supabase konekciju

1. Idi na `/map` stranicu
2. U browser console (F12 → Console), trebalo bi da vidiš:
   - Nema greške
   - "Supabase client initialized"

Ako vidiš grešku, proveri:
- Da li su `.env.local` vrednosti tačne?
- Da li si koristio pravi `SUPABASE_URL` i `SUPABASE_ANON_KEY`?

## Korak 8: Testiraj SQL bazu

```bash
# Otvori Supabase SQL Editor:
# 1. Dashboard → SQL Editor → New query
# 2. Kopira:

SELECT * FROM categories;
```

Trebalo bi da vidis 7 kategorija ako je baza pravilno postavljena.

## 📋 Sledeći koraci za razvoj

### Prioritet 1 (Odmah):
1. [ ] Instaliraj Mapbox ili Leaflet (`npm install react-leaflet leaflet`)
2. [ ] Napravi Map komponentu koja učitava probleme
3. [ ] Kreiraj authentication stranicu (sign up, sign in)
4. [ ] Testiraj sa stvarnim podacima

### Prioritet 2 (Nedelja 2):
1. [ ] Dodaj foto upload
2. [ ] Kreiraj ReportForm sa geolokacijom
3. [ ] Testiraj prijavu problema
4. [ ] Kreiraj detaljnu stranicu problema

### Prioritet 3 (Nedelja 3):
1. [ ] Admin panel
2. [ ] Status promena
3. [ ] Real-time ažuriranja
4. [ ] Testing

## 🆘 Česta pitanja

### Q: Dobijam grešku "Supabase environment variables are not set"
A: Proveri `.env.local` fajl. Trebalo bi da sadrži tačne vrednosti iz Supabase dashboard-a.

### Q: Upload fotografije ne radi
A: Kreiraj bucket za slike:
1. Supabase Dashboard → Storage
2. Klikni "New bucket"
3. Naziv: `report-photos`
4. Public bucket: YES
5. Create

### Q: Real-time ne radi
A: Proverite RLS policies u SETUP_DATABASE.md. Trebalo bi da budete aplikovane.

### Q: Aplikacija je spora
A: Prvo pokretanja će biti spora dok se sve ne cache-uje. Drugi put bi trebalo da bude brža.

### Q: Gde je Mapbox ključ?
A: Mapbox ključ je opcionan. Možeš koristiti Leaflet sa OpenStreetMap (besplatno). Ako želiš Mapbox, kreiraj account na mapbox.com.

## 🎓 Resursi

- [Next.js dokumentacija](https://nextjs.org/docs)
- [Supabase dokumentacija](https://supabase.com/docs)
- [Tailwind CSS dokumentacija](https://tailwindcss.com/docs)
- [React Leaflet](https://react-leaflet.js.org)
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) - Detaljni plan razvoja

## 📊 Project struktura

```
gderupa/
├── app/                    # Next.js 14 app directory
│   ├── layout.tsx         # Glavni layout
│   ├── page.tsx           # Landing page
│   ├── map/               # Map stranica
│   ├── report/            # Report stranica
│   ├── admin/             # Admin stranica
│   └── globals.css        # Global stilovi
├── lib/                    # Utility fajlovi
│   ├── supabase.ts        # Supabase klijent
│   └── store.ts           # Zustand store
├── public/                 # Statički fajlovi
│   └── manifest.json      # PWA manifest
├── .env.example           # Environment template
├── package.json           # Zavisnosti
├── tsconfig.json          # TypeScript config
├── tailwind.config.ts     # Tailwind config
└── DEVELOPMENT_PLAN.md    # Plan razvoja
```

## 🚀 Pokretanje build-a

```bash
# Build za produkciju
npm run build

# Start produkcijske verzije lokalno
npm start

# Type checking
npm run type-check
```

## 🐛 Debugging

```bash
# Vidi sve environment varijable (privé!)
echo $env:NEXT_PUBLIC_SUPABASE_URL

# Očisti Next.js cache
rm -r .next

# Očisti node_modules
rm -r node_modules
npm install
```

## ✅ Checklist

- [ ] Supabase account kreiran
- [ ] Baza podataka postavljena
- [ ] `.env.local` fajl kreiran
- [ ] `npm install` završeno
- [ ] `npm run dev` pokrenut
- [ ] http://localhost:3000 radi
- [ ] `/map` stranica učitava se
- [ ] Nema greške u konzoli

---

**Trebanja pomoć?**
- Vidi `REQUIREMENTS.md` za sve zahteve
- Vidi `SETUP_DATABASE.md` za SQL probleme
- Vidi `DEVELOPMENT_PLAN.md` za plan razvoja

**Status:** 🟢 Spreman za razvoj!

---
**Poslednje ažuriranje:** 15. maja 2026.
