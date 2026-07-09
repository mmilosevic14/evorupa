# EvoRupa - Zahtevi i Requirements

## 1. Funkcionalnih zahteva

### 1.1 Citizen (Građanin) zahteva
- [ ] Registracija i login
- [ ] Fotografisanje problema
- [ ] Geolokacija problema
- [ ] Prijava problema na mapi
- [ ] Izbor kategorije problema
- [ ] Detaljno opisivanje problema
- [ ] Videnje svoje verzije prijave
- [ ] Videnje statusa svoje prijave
- [ ] Videnje svih prijava na mapi
- [ ] Komentarisanje na probleme
- [ ] Glasanje za probleme (upvote)
- [ ] Notifikacije kada se problem promeni

### 1.2 Deputy (Zastupnik) zahteva
- [ ] Sve što citizen može
- [ ] Pregled svih prijava
- [ ] Filtriranje prijava po statusu
- [ ] Filtriranje prijava po kategoriji
- [ ] Filtriranje prijava po lokaciji
- [ ] Menjanje statusa prijave
- [ ] Dodavanje komentara kao deputy
- [ ] Kontaktiranje korisnika
- [ ] Izvoz izveštaja

### 1.3 Admin zahteva
- [ ] Sve što deputy može
- [ ] Upravljanje korisnicima
- [ ] Brisanje neprikladno prijava
- [ ] Upravljanje kategorijama
- [ ] Analytics i statistika
- [ ] Upravljanje sistema
- [ ] Brisanje korisnika

## 2. Nefunkcionalni zahtevi

### 2.1 Performance
- [ ] Učitavanje mape < 2 sekunde
- [ ] Registracija < 3 sekunde
- [ ] Prijava problema < 5 sekundi
- [ ] Page load < 1 sekunde
- [ ] API response < 500ms

### 2.2 Scalability
- [ ] Suporta za 10.000+ korisnika
- [ ] Suporta za 100.000+ prijava
- [ ] Real-time ažuriranje za 100+ istovremenih korisnika
- [ ] Automatic scaling sa Supabase

### 2.3 Security
- [ ] HTTPS samo
- [ ] Password hashing (bcrypt)
- [ ] Email verifikacija
- [ ] Rate limiting na API
- [ ] CORS konfiguracija
- [ ] Input validation
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Row Level Security (RLS)

### 2.4 Availability
- [ ] 99.5% uptime
- [ ] Failover za database
- [ ] Backup svakog dana
- [ ] CDN za statične fajlove

### 2.5 Compatibility
- [ ] Desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile browsers (iOS Safari, Chrome Android)
- [ ] Offline mode (PWA)
- [ ] Works on slow networks (3G, 4G)

## 3. User Experience zahtevi

### 3.1 Usability
- [ ] Intuitivna navigacija
- [ ] Responsive design (mobile-first)
- [ ] Jednostavna registracija (max 2 klika)
- [ ] Jednostavna prijava problema (max 3 koraka)
- [ ] Clear error messages
- [ ] Help/FAQ stranica

### 3.2 Accessibility
- [ ] WCAG 2.1 Level AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast (4.5:1 minimum)
- [ ] Alt text za sve slike

### 3.3 Localization
- [ ] Srpski jezik (Latin i Ćirilic)
- [ ] Engleski jezik (za budućnost)
- [ ] Lokalni vremenske zone
- [ ] Lokalni formati datuma

## 4. Data Requirements

### 4.1 Data za Report
- `id` - UUID
- `user_id` - Reference na user
- `title` - String (max 255 char)
- `description` - Text
- `category` - Enum (road_damage, pothole, traffic_sign, street_light, sidewalk, parking, other)
- `latitude` - Decimal (10,8)
- `longitude` - Decimal (11,8)
- `photo_url` - String (URL ka supabase storage)
- `status` - Enum (pending, in_progress, resolved, rejected)
- `priority` - Enum (low, medium, high, critical)
- `tags` - Array of strings
- `upvotes` - Integer
- `views` - Integer
- `created_at` - Timestamp
- `updated_at` - Timestamp
- `resolved_at` - Timestamp

### 4.2 Data za User
- `id` - UUID
- `email` - String (unique)
- `full_name` - String
- `avatar_url` - String (URL)
- `role` - Enum (citizen, deputy, admin)
- `phone` - String
- `city` - String
- `municipality` - String
- `bio` - Text
- `is_verified` - Boolean
- `created_at` - Timestamp
- `updated_at` - Timestamp

### 4.3 Data za Comment
- `id` - UUID
- `report_id` - Reference
- `user_id` - Reference
- `content` - Text
- `is_admin` - Boolean
- `created_at` - Timestamp
- `updated_at` - Timestamp

## 5. Integration zahtevi

### 5.1 Third-party servisi
- [ ] Supabase (database, auth, storage)
- [ ] Mapbox ili Leaflet (maps)
- [ ] SendGrid ili Mailgun (email)
- [ ] AWS S3 ili Supabase Storage (file storage)
- [ ] Vercel (hosting)

### 5.2 External APIs
- [ ] Google Maps API (opciono, za dodatne info)
- [ ] Weather API (opciono, za kontekst)
- [ ] Local government APIs (budućnost)

## 6. Compliance zahtevi

### 6.1 Legal
- [ ] GDPR compliance
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie Policy
- [ ] Accessibility Statement

### 6.2 Standards
- [ ] Open Graph meta tags
- [ ] Twitter Card meta tags
- [ ] Structured data (JSON-LD)
- [ ] Sitemap
- [ ] Robots.txt

## 7. Testing zahtevi

### 7.1 Unit Testing
- [ ] Component tests
- [ ] Utility function tests
- [ ] Minimum 70% code coverage

### 7.2 Integration Testing
- [ ] API integration tests
- [ ] Database tests
- [ ] Authentication tests

### 7.3 E2E Testing
- [ ] User registration flow
- [ ] Report submission flow
- [ ] Map interaction
- [ ] Admin operations

### 7.4 Performance Testing
- [ ] Load testing (1000+ users)
- [ ] Stress testing
- [ ] Lighthouse score > 90

### 7.5 Security Testing
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] OWASP Top 10 check

## 8. Documentation zahtevi

### 8.1 Code Documentation
- [ ] JSDoc comments na funkcijama
- [ ] README.md
- [ ] DEVELOPMENT_PLAN.md
- [ ] SETUP_DATABASE.md
- [ ] API_REFERENCE.md

### 8.2 User Documentation
- [ ] Help/FAQ
- [ ] User guide
- [ ] Video tutorials
- [ ] Troubleshooting guide

## 9. Deployment zahtevi

### 9.1 CI/CD
- [ ] Automated tests na pull requests
- [ ] Automated linting
- [ ] Automated type checking
- [ ] Automated deployment

### 9.2 Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] User analytics
- [ ] Uptime monitoring

## 10. Support zahtevi

### 10.1 Technical Support
- [ ] GitHub Issues
- [ ] Email support
- [ ] Discord community
- [ ] Regular updates

### 10.2 Feedback
- [ ] In-app feedback form
- [ ] User surveys
- [ ] Feature requests
- [ ] Bug reports

---

## Prioriteti

| Prioritet | Zahtevi | Timeline |
|-----------|---------|----------|
| P0 (Must-have) | 1.1, 1.2 deo, 2.1-2.3, 3.1, 4, 9 | Sprint 1-4 |
| P1 (Should-have) | 1.2 ostatak, 2.4-2.5, 3.2, 5, 7, 8 | Sprint 5-8 |
| P2 (Nice-to-have) | 1.3, 6, 10, Localization | Sprint 9-14 |

---

## Acceptance Criteria

### AC1: User Registration
```
Given: Korisnik na landing page
When: Klikne "Registruj se"
Then: 
  - Vidi registration form
  - Može uneti email i password
  - Može registrovati se
  - Dobija verification email
  - Može verifikovati email
  - Može da se login
```

### AC2: Report Submission
```
Given: Autentifikovani korisnik
When: Klikne "Prijavi problem"
Then:
  - Vidi report form
  - Može fotografisati
  - Može odabrati kategoriju
  - Može uneti lokaciju
  - Može uneti opis
  - Može da pošalje
  - Problem se pojavljuje na mapi
```

### AC3: Map Display
```
Given: Svaki korisnik
When: Vidi "Mapa" stranicu
Then:
  - Vidi mapu Srbije
  - Vidi markere za sve probleme
  - Može kliknuti na marker
  - Vidi detalje problema
  - Može da vota
  - Može da kometariše (ako je login)
```

---

**Poslednje ažuriranje:** 15. maja 2026.
**Verzija dokumenta:** 1.0
