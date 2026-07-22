# SIMAGO — Sistem Magang Go (Frontend)

Frontend React + TypeScript + Tailwind untuk SIMAGO. Awalnya prototipe dengan
mock data, sekarang sudah disambungkan penuh ke backend **Laravel 12 API**
(lihat proyek `simago-api-backend.zip` yang terpisah) — tampilan, layout,
warna, dan struktur komponen **tidak diubah sama sekali**, hanya sumber
datanya yang berubah dari array statis menjadi panggilan Axios ke REST API.

## Menjalankan

```bash
npm install
cp .env.example .env      # sesuaikan VITE_API_URL kalau backend tidak di localhost:8000
npm run dev
```

Pastikan backend Laravel (`simago-api-backend.zip`) sudah jalan di
`http://127.0.0.1:8000` (atau sesuaikan `VITE_API_URL` di `.env`) dan
`FRONTEND_URL` di `.env` backend mengarah ke alamat dev server ini
(default Vite: `http://localhost:5173`), supaya CORS tidak diblokir.

## Struktur integrasi API

- `src/app/lib/api.ts` — instance Axios terpusat: base URL dari
  `VITE_API_URL`, menyisipkan token Bearer dari `localStorage` secara
  otomatis, dan memaksa logout kalau server membalas 401.
- `src/app/App.tsx` — seluruh halaman (dashboard, tabel, form, chart)
  mengambil data lewat `api.get/post/put/delete`, dengan state
  loading / empty / error yang konsisten (`LoadingState`, `EmptyState`,
  `ErrorState`) di setiap halaman yang memuat data dari server.

## Akun demo

Sama seperti seeder backend:

| Role       | Email                  | Password       |
|------------|--------------------------|----------------|
| Admin      | admin@simago.id         | admin123       |
| Pembimbing | pembimbing@simago.id    | pembimbing123  |
| Calon      | calon@simago.id         | calon123       |
| Peserta    | peserta@simago.id       | peserta123     |

## Build produksi

```bash
npm run build   # menghasilkan folder dist/, sudah diverifikasi berhasil (vite build + tsc --noEmit bersih)
```

## Catatan keterbatasan

Halaman **Rekomendasi Kelulusan** (pembimbing) memakai rating
(kedisiplinan/teknis/sikap/inisiatif) sebagai alat bantu visual saja —
backend belum punya tabel khusus untuk menyimpan nilai tersebut. Tombol
"Submit Rekomendasi ke Admin" tetap fungsional dan menandai peserta
sebagai selesai magang (siap diterbitkan sertifikatnya dari halaman
admin Kelola Sertifikat). Beri tahu saya kalau rating itu perlu benar-benar
tersimpan di database — saya bisa tambahkan tabel & endpoint kecil untuk itu.
