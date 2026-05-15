# GDeRupa - Supabase Setup Vodič

## 1. Kreiraj Supabase Projekat

1. Idi na https://supabase.com
2. Klikni "New Project"
3. Odaberi region (preporuka: EU - Frankfurt ili London za Srbiju)
4. Napiši lozinku za direktan pristup bazi podataka
5. Čekaj da se kreira (2-3 minuta)

## 2. Preuzmi kredencijale

U Supabase dashboard:
1. Idi na "Settings" → "API"
2. Kopira `Project URL` 
3. Kopira `anon public` key
4. Dodaj u `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx...
```

## 3. Kreiraj baze podataka

### 3.1 Tabela: users
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'citizen',
  phone VARCHAR(20),
  city VARCHAR(100),
  municipality VARCHAR(100),
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksi
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);
```

### 3.2 Tabela: reports (prijave)
```sql
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  tags TEXT[],
  upvotes INT DEFAULT 0,
  views INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indeksi za performanse
CREATE INDEX reports_user_id_idx ON reports(user_id);
CREATE INDEX reports_status_idx ON reports(status);
CREATE INDEX reports_category_idx ON reports(category);
CREATE INDEX reports_location_idx ON reports(latitude, longitude);
CREATE INDEX reports_created_at_idx ON reports(created_at DESC);
```

### 3.3 Tabela: comments (komentari)
```sql
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX comments_report_id_idx ON comments(report_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
```

### 3.4 Tabela: votes (glasovi)
```sql
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

CREATE INDEX votes_report_id_idx ON votes(report_id);
CREATE INDEX votes_user_id_idx ON votes(user_id);
```

### 3.5 Tabela: updates (ažuriranja o problemu)
```sql
CREATE TABLE IF NOT EXISTS updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX updates_report_id_idx ON updates(report_id);
```

## 4. Postavi Row Level Security (RLS)

### 4.1 Enable RLS na svim tabelama
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
```

### 4.2 Policy za users
```sql
-- Svako može videti profile
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

-- Korisnik može updatovati svoj profil
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### 4.3 Policy za reports
```sql
-- Svako može videti sve prijave
CREATE POLICY "Anyone can view reports"
  ON reports FOR SELECT
  USING (true);

-- Korisnik može kreirati prijavu
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Korisnik može updatovati svoju prijavu
CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin može updatovati bilo koju prijavu
CREATE POLICY "Admins can update any report"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'deputy')
    )
  );

-- Korisnik može obrisati svoju prijavu
CREATE POLICY "Users can delete own reports"
  ON reports FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.4 Policy za comments
```sql
-- Svako može videti komentare
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

-- Korisnik može dodati komentar
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Korisnik može obrisati svoj komentar
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);
```

## 5. Postavi Storage za slike

### 5.1 Kreiraj bucket
```sql
-- U Supabase SQL editor ili Storage UI:
-- 1. Idi na "Storage"
-- 2. Klikni "New bucket"
-- 3. Naziv: "report-photos"
-- 4. Public bucket: YES (da su slike vidljive svima)
5. Klikni "Create bucket"
```

### 5.2 RLS policy za storage
```sql
-- Svako može čitati slike
CREATE POLICY "Public access to report photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-photos');

-- Samo autentifikovani korisnici mogu uploadovati
CREATE POLICY "Users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'report-photos'
    AND auth.role() = 'authenticated'
  );

-- Korisnik može obrisati svoje slike
CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'report-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 6. Postavi kategorizaciju problema

```sql
-- Kreiraj enum type
CREATE TYPE problem_category AS ENUM (
  'road_damage',
  'pothole',
  'traffic_sign',
  'street_light',
  'sidewalk',
  'parking',
  'other'
);

-- Kreiraj tabelu sa kategorizama
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(7)
);

-- Dodaj default kategorije
INSERT INTO categories (name, description, icon, color) VALUES
  ('road_damage', 'Oštećenje asfalta', '🛣️', '#DC2626'),
  ('pothole', 'Rupa na putu', '🕳️', '#EA580C'),
  ('traffic_sign', 'Problem sa znakom', '🚧', '#F59E0B'),
  ('street_light', 'Problem sa osvetljenjem', '💡', '#F4D03F'),
  ('sidewalk', 'Problem sa pločnikom', '🚶', '#A78BFA'),
  ('parking', 'Problem sa parkiranjem', '🚗', '#60A5FA'),
  ('other', 'Ostalo', '❓', '#6B7280');
```

## 7. Postavi status prijavljivanja

```sql
-- Kreiraj enum type
CREATE TYPE report_status AS ENUM (
  'pending',
  'in_progress',
  'resolved',
  'rejected'
);

-- Kreiraj tabelu sa statusima
CREATE TABLE IF NOT EXISTS statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100)
);

-- Dodaj default statuse
INSERT INTO statuses (name, description, icon) VALUES
  ('pending', 'Čeka se obrada', '⏳'),
  ('in_progress', 'U obradi', '⚙️'),
  ('resolved', 'Rešeno', '✅'),
  ('rejected', 'Odbijeno', '❌');
```

## 8. Testiranje

### 8.1 Test insert
```sql
-- Kreiraj test korisnika
INSERT INTO users (email, full_name, role)
VALUES ('test@example.com', 'Test User', 'citizen');

-- Kreiraj test prijavu
INSERT INTO reports (user_id, title, description, category, latitude, longitude)
SELECT 
  id,
  'Test Prijava',
  'Ovo je test prijava',
  'pothole',
  44.8176,
  20.4633
FROM users
WHERE email = 'test@example.com';

-- Proverite
SELECT * FROM reports;
```

### 8.2 Test real-time subscription
Vidi `lib/supabase.ts` za primer

## 9. Backup i Disaster Recovery

1. U Supabase → Settings → Backups
2. Postavi automatski backup (dnevno je default)
3. Preuzmi backup kada je potrebno

## 10. Uobičajeni problemi i rešenja

### Problem: Upload slike ne radi
```
Proveri:
1. da li je bucket javno dostupan
2. da li je RLS policy ispravan
3. da li je korisnik autentifikovan
```

### Problem: Real-time ne radi
```
Proveri:
1. da li je real-time enabled
2. da li su channels pravilno postavljeni
3. da li je network stabilan
```

### Problem: RLS "permission denied"
```
Proveri:
1. da li je korisnik auth.uid() pravilno setovan
2. da li je policy ispravan
3. da li je korisnik autentifikovan
```

---

**Poslednje ažuriranje:** 15. maja 2026.
**Verzija:** 1.0

## Sledeći koraci

1. ✅ Kreiraj Supabase projekat
2. ✅ Postavi sve tabele i RLS
3. ✅ Konfiguruj storage
4. ⏳ Testiraj sve konekcije
5. ⏳ Kreiraj test podatke
