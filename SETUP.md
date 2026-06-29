# Cara Setup & Deploy Fruyu App

## Langkah 1 — Setup Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Isi nama project: `fruyu`, pilih region terdekat (Singapore)
3. Tunggu project siap (~2 menit)

### Jalankan Database Schema

1. Di Supabase, klik **SQL Editor** di sidebar kiri
2. Klik **New query**
3. Copy-paste seluruh isi file `supabase/schema.sql`
4. Klik **Run** (atau Ctrl+Enter)

### Aktifkan Google Login

1. Di Supabase, klik **Authentication** → **Providers**
2. Klik **Google** → toggle **Enabled**
3. Kamu butuh **Google OAuth credentials**:
   - Buka [console.cloud.google.com](https://console.cloud.google.com)
   - Buat project baru → **APIs & Services** → **Credentials**
   - Klik **Create Credentials** → **OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Authorized redirect URIs: tambahkan URL yang ada di Supabase (format: `https://[project-id].supabase.co/auth/v1/callback`)
   - Copy **Client ID** dan **Client Secret** ke Supabase
4. Di Supabase Authentication → **URL Configuration**:
   - Site URL: `http://localhost:3000` (untuk development)
   - Redirect URLs: tambahkan `http://localhost:3000/auth/callback`

### Ambil API Keys

1. Supabase → **Project Settings** → **API**
2. Copy:
   - **Project URL** (bentuk: `https://xxx.supabase.co`)
   - **anon public** key

## Langkah 2 — Setup Local Development

1. Edit file `.env.local` di folder `fruyu-app`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

2. Jalankan development server:

```bash
cd fruyu-app
npm run dev
```

3. Buka [http://localhost:3000](http://localhost:3000)

## Langkah 3 — Input Data Awal

Urutan yang benar:
1. **Settings → Bahan Baku** — tambah semua bahan baku + set stok awal + batas minimum
2. **Settings → Produk** — tambah semua produk + set resep tiap produk
3. **Settings → Promo** — tambah promo kalau ada
4. Coba **Catat Penjualan** dari Dashboard

## Langkah 4 — Deploy ke Vercel (opsional)

1. Push folder `fruyu-app` ke GitHub
2. Buka [vercel.com](https://vercel.com) → **New Project** → import dari GitHub
3. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik Deploy
5. Setelah deploy, tambahkan URL Vercel ke Supabase:
   - Authentication → URL Configuration → Site URL: `https://fruyu-app.vercel.app`
   - Redirect URLs: `https://fruyu-app.vercel.app/auth/callback`
   - Google OAuth → Authorized redirect URIs: tambahkan `https://[project-id].supabase.co/auth/v1/callback` (sudah ada dari sebelumnya)
