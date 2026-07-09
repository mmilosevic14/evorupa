# EvoRupa - Plan razvoja

## Faza 1: MVP (Minimum Viable Product) - 4 nedelje

### Sprint 1: Setup & Autentifikacija (1. nedelja)
- [x] Inicijalizacija Next.js projekta
- [ ] Supabase setup
- [ ] Autentifikacija (sign up, sign in, sign out)
- [ ] Role-based access control (RBAC)
- [ ] Email verifikacija

**Zadaci:**
1. Kreiraj `auth/login` stranicu
2. Kreiraj `auth/signup` stranicu
3. Postavi Supabase Authentication
4. Kreiraj Auth context/store
5. Zaštiti rute prema ulogama

### Sprint 2: Mapa & Prikazivanje (2. nedelja)
- [ ] Integracija Leaflet mape
- [ ] Učitavanje problema sa baze
- [ ] Markeri za svaki problem
- [ ] Popup sa informacama
- [ ] Geolokacija korisnika

**Zadaci:**
1. Instaliraj Leaflet (`react-leaflet`, `leaflet`)
2. Kreiraj `Map.tsx` komponentu
3. Kreiraj `ReportMarker.tsx` komponentu
4. Kreiraj `ReportPopup.tsx` komponentu
5. Dodaj geolokaciju

### Sprint 3: Prijava problema (3. nedelja)
- [ ] Forma za prijavu
- [ ] Upload fotografije
- [ ] Validacija formi
- [ ] Spremi podatke u Supabase
- [ ] Prikaži potvrdu

**Zadaci:**
1. Poboljšaj `ReportForm` stranicu
2. Dodaj file upload
3. Kreiraj API rute za upload slike
4. Dodaj client-side validaciju
5. Kreiraj success modal

### Sprint 4: Admin panel & Testiranje (4. nedelja)
- [ ] Admin pregled svih prijava
- [ ] Promeniti status prijave
- [ ] Filtri i search
- [ ] Statistika
- [ ] Testiranje aplikacije

**Zadaci:**
1. Poboljšaj admin dashboard
2. Kreiraj tabelu sa svim prijavaama
3. Dodaj status update funkcionalnost
4. Kreiraj filtere
5. Kreiraj statistiku
6. Testiranje

---

## Faza 2: PWA & Real-time (4 nedelje)

### Sprint 5: PWA Setup (5. nedelja)
- [ ] next-pwa konfiguracija
- [ ] Manifest.json
- [ ] Service worker
- [ ] Offline stranice
- [ ] Install prompt

**Zadaci:**
1. Postavi `next-pwa`
2. Kreiraj manifest.json
3. Kreiraj offline page
4. Test offline mode
5. Test na mobilnom

### Sprint 6: Real-time & Push notifikacije (6. nedelja)
- [ ] Supabase real-time subscriptions
- [ ] Live ažuriranje mape
- [ ] Push notifikacije
- [ ] Background sync

**Zadaci:**
1. Postavi Supabase real-time
2. Kreiraj real-time hook
3. Dodaj push notifikacije
4. Test sinhronizacija

### Sprint 7: Optimizacija & Performanse (7. nedelja)
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Cache strategije
- [ ] Bundle size analiza
- [ ] Performance testing

**Zadaci:**
1. Optimizuj slike
2. Dodaj lazy loading
3. Konfiguruj cache
4. Analiza performansi
5. Load testing

### Sprint 8: Bug fixing & Dokumentacija (8. nedelja)
- [ ] Bug fixing
- [ ] Dokumentacija koda
- [ ] API dokumentacija
- [ ] Deployment priprema

**Zadaci:**
1. Fix svi bugovi
2. Napiši komentare
3. Napiši API docs
4. Pripremi deployment

---

## Faza 3: Proširenje (6 nedelja)

### Sprint 9-10: Notifikacije & Email
- [ ] Email notifikacije
- [ ] SMS notifikacije (optional)
- [ ] Notification templates
- [ ] Scheduling

### Sprint 11-12: Analytics & Reporting
- [ ] Google Analytics integracija
- [ ] Reports generation
- [ ] Data export
- [ ] Dashboard sa KPI

### Sprint 13-14: Zajednica & Gamifikacija
- [ ] User profiles
- [ ] Comments na probleme
- [ ] Voting sistem
- [ ] Achievements/badges

---

## Tehnički zahtevi

### Backend/Database
```sql
-- Tabele koje trebamo
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  role ENUM('citizen', 'deputy', 'admin'),
  created_at TIMESTAMP
);

CREATE TABLE reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  photo_url VARCHAR(255),
  status ENUM('pending', 'in_progress', 'resolved'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Vidi SETUP_DATABASE.md za kompletan SQL
```

### Frontend komponente

```
Komponente za build:
├── /components
│   ├── Map.tsx                    # Mapa
│   ├── ReportForm.tsx             # Forma
│   ├── ReportCard.tsx             # Kartice sa problemima
│   ├── AdminTable.tsx             # Admin tabela
│   ├── UserProfile.tsx            # Profil
│   ├── Navbar.tsx                 # Navigacija
│   └── Footer.tsx                 # Footer
├── /hooks
│   ├── useReports.ts              # Custom hook za probleme
│   ├── useAuth.ts                 # Custom hook za autentifikaciju
│   ├── useGeolocation.ts          # Custom hook za lokaciju
│   └── useRealtime.ts             # Real-time subscription hook
└── /utils
    ├── validators.ts              # Validacija
    ├── formatters.ts              # Formatiranje
    └── api.ts                      # API pozivi
```

### API rute

```
API Endpoints:
POST   /api/auth/signup            # Registracija
POST   /api/auth/login             # Login
POST   /api/auth/logout            # Logout
GET    /api/reports                # Sve prijave
POST   /api/reports                # Nova prijava
GET    /api/reports/:id            # Detalji prijave
PUT    /api/reports/:id            # Ažuriranje
DELETE /api/reports/:id            # Brisanje
GET    /api/reports/filter?        # Filtrirane prijave
POST   /api/upload                 # Upload slike
```

---

## Timeline

| Faza | Trajanje | Status |
|------|----------|--------|
| MVP | 4 nedelje | ⏳ U toku |
| PWA | 4 nedelje | ⏸️ Planirana |
| Proširenje | 6 nedelja | ⏸️ Planirana |
| **Ukupno** | **14 nedelja** | |

---

## Prioriteti

### Must-have (MVP)
1. Mapa sa problemima
2. Prijava problema
3. Autentifikacija
4. Supabase integracija
5. Admin panel

### Should-have (Faza 2-3)
1. PWA funkcionalnosti
2. Real-time ažuriranja
3. Push notifikacije
4. Analytics

### Nice-to-have (Budućnost)
1. Mobilne aplikacije (React Native)
2. API za treće strane
3. Multi-jezičnost
4. Integracija sa lokalnom vladom

---

## Rizici i mitigation

| Rizik | Verovatnoća | Uticaj | Mitigation |
|-------|-------------|--------|-----------|
| Supabase downtime | Srednja | Visok | Failover plan, caching |
| Spore performanse | Srednja | Srednji | Optimizacija, CDN |
| Security exploit | Niska | Visok | Security audit, penetration testing |
| Nizak user adoption | Srednja | Visok | Marketing, community |

---

## Susedni koraci

1. ✅ Inicijalizacija koda
2. ⏳ Supabase setup (korisnik)
3. ⏳ Lokalni development environment
4. ⏳ First pull request
5. ⏳ CI/CD pipeline

---

## Pitanja za razjašnjenje

- [ ] Koja je ciljana demografija?
- [ ] Koji jezici treba da budu podržani?
- [ ] Da li trebaju SMS notifikacije?
- [ ] Koji SLA (Service Level Agreement) je potreban?
- [ ] Integracija sa lokalnom vladom API-jima?

---

**Poslednje ažuriranje:** 15. maja 2026.
**Verzija dokumenta:** 1.0
