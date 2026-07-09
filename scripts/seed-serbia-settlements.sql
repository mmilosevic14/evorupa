INSERT INTO public.settlements (name, municipality, district, region, place_type, latitude, longitude)
VALUES
  ('Beograd', 'Beograd', 'Grad Beograd', 'Srbija', 'city', 44.8176, 20.4633),
  ('Novi Sad', 'Novi Sad', 'Južnobački upravni okrug', 'Srbija', 'city', 45.2671, 19.8335),
  ('Niš', 'Niš', 'Nišavski upravni okrug', 'Srbija', 'city', 43.3209, 21.8958),
  ('Kragujevac', 'Kragujevac', 'Šumadijski upravni okrug', 'Srbija', 'city', 44.0128, 20.9114),
  ('Subotica', 'Subotica', 'Severnobački upravni okrug', 'Srbija', 'city', 46.1000, 19.6667),
  ('Zrenjanin', 'Zrenjanin', 'Srednjobanatski upravni okrug', 'Srbija', 'city', 45.3836, 20.3819),
  ('Pančevo', 'Pančevo', 'Južnobanatski upravni okrug', 'Srbija', 'city', 44.8718, 20.6413),
  ('Sombor', 'Sombor', 'Zapadnobački upravni okrug', 'Srbija', 'city', 45.7742, 19.1122),
  ('Kraljevo', 'Kraljevo', 'Raški upravni okrug', 'Srbija', 'city', 43.7258, 20.6894),
  ('Čačak', 'Čačak', 'Moravički upravni okrug', 'Srbija', 'city', 43.8914, 20.3497),
  ('Užice', 'Užice', 'Zlatiborski upravni okrug', 'Srbija', 'city', 43.8556, 19.8425),
  ('Valjevo', 'Valjevo', 'Kolubarski upravni okrug', 'Srbija', 'city', 44.2751, 19.8982),
  ('Smederevo', 'Smederevo', 'Podunavski upravni okrug', 'Srbija', 'city', 44.6644, 20.9276),
  ('Požarevac', 'Požarevac', 'Braničevski upravni okrug', 'Srbija', 'city', 44.6213, 21.1878),
  ('Pirot', 'Pirot', 'Pirotski upravni okrug', 'Srbija', 'city', 43.1531, 22.5861),
  ('Vranje', 'Vranje', 'Pčinjski upravni okrug', 'Srbija', 'city', 42.5514, 21.9003),
  ('Zlatibor', 'Čajetina', 'Zlatiborski upravni okrug', 'Srbija', 'town', 43.7297, 19.6990),
  ('Vrnjačka Banja', 'Vrnjačka Banja', 'Raški upravni okrug', 'Srbija', 'town', 43.6217, 20.8968),
  ('Aranđelovac', 'Aranđelovac', 'Šumadijski upravni okrug', 'Srbija', 'town', 44.3069, 20.5603),
  ('Bajina Bašta', 'Bajina Bašta', 'Zlatiborski upravni okrug', 'Srbija', 'town', 43.9708, 19.5675),
  ('Guča', 'Lučani', 'Moravički upravni okrug', 'Srbija', 'village', 43.7762, 20.2253),
  ('Mokra Gora', 'Čajetina', 'Zlatiborski upravni okrug', 'Srbija', 'village', 43.7944, 19.5226),
  ('Tršić', 'Loznica', 'Mačvanski upravni okrug', 'Srbija', 'village', 44.4983, 19.2818),
  ('Sirogojno', 'Čajetina', 'Zlatiborski upravni okrug', 'Srbija', 'village', 43.6818, 19.8936),
  ('Topola', 'Topola', 'Šumadijski upravni okrug', 'Srbija', 'town', 44.2525, 20.6775)
ON CONFLICT (name, municipality, district)
DO UPDATE SET
  region = EXCLUDED.region,
  place_type = EXCLUDED.place_type,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  updated_at = NOW();