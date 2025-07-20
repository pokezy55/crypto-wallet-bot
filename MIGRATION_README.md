# Migrasi Database untuk Sistem Referral

File ini berisi instruksi untuk menjalankan migrasi database yang diperlukan untuk sistem referral dengan kode kustom.

## Masalah

Error yang muncul:
- `Error: column "custom_code" does not exist`
- `Error: column "details" does not exist`

Ini terjadi karena database di Vercel belum memiliki kolom-kolom yang dibutuhkan untuk sistem referral baru.

## Solusi

1. Jalankan file SQL migrasi `migration-add-custom-code.sql` pada database PostgreSQL di Vercel.

## Cara Menjalankan Migrasi

### Menggunakan psql CLI (jika Anda memiliki akses langsung ke database)

```bash
psql -U username -d database_name -h host -f migration-add-custom-code.sql
```

### Menggunakan Vercel Dashboard

1. Buka Vercel Dashboard
2. Pilih project crypto-wallet-bot
3. Buka tab "Storage"
4. Pilih database PostgreSQL
5. Buka "Query" tab
6. Copy dan paste isi dari file `migration-add-custom-code.sql`
7. Klik "Run Query"

### Menggunakan Vercel CLI

1. Install Vercel CLI jika belum ada:
```bash
npm i -g vercel
```

2. Login ke Vercel:
```bash
vercel login
```

3. Link project (jika belum):
```bash
vercel link
```

4. Dapatkan URL database:
```bash
vercel env pull .env.local
```

5. Gunakan URL database dari file .env.local untuk terhubung dengan psql atau tool database lainnya.

## Verifikasi

Setelah menjalankan migrasi, pastikan kolom-kolom berikut telah ditambahkan:

1. `custom_code` di tabel `users`
2. `details` di tabel `claims`
3. `referral_code` di tabel `users` (jika belum ada)
4. `referred_by` di tabel `users` (jika belum ada)

## Catatan

- Migrasi ini menggunakan `IF NOT EXISTS` sehingga aman dijalankan berulang kali
- Jika ada error lain setelah migrasi, periksa log untuk detail lebih lanjut 