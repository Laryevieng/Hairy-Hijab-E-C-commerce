# Project Plan SaaS E-Commerce Hairy Hijab — Edisi 2.0 (Agent-Ready)

| | |
|---|---|
| **Dokumen** | Project Plan, Technical Blueprint, dan Panduan Eksekusi untuk AI Agent |
| **Versi** | 2.0 — revisi total dari Rancangan Awal 1.0 |
| **Tanggal revisi** | 20 Oktober 2026 |
| **Proyek** | Hairy Hijab — e-commerce B2C hijab dengan fondasi yang dapat dikembangkan menjadi SaaS multi-tenant |
| **Stack** | Next.js (App Router) + TypeScript + Supabase (PostgreSQL, Auth, Storage, RLS) |
| **Bahasa dokumen** | Indonesia. Identifier kode (nama tabel, fungsi, file) memakai bahasa Inggris. |
| **Sifat dokumen** | **Sumber kebenaran tunggal.** Ditulis agar model atau agent AI apa pun dapat melanjutkan pekerjaan tanpa riwayat percakapan sebelumnya. |

---

## 0. Cara Memakai Dokumen Ini dan Protokol Agent

### 0.1 Untuk pemilik proyek (manusia)

1. Pastikan dokumen ini berada di dalam repository Git (lokasi akhir: `docs/PROJECT_PLAN.md`, diatur pada task P0-06).
2. Setiap membuka sesi baru, atau setelah berganti akun atau model, tempel **Prompt Peluncur Sesi** dari Lampiran B. Tidak perlu menjelaskan ulang apa pun.
3. Jawab pertanyaan di §19 secepatnya. Task bertanda **[PEMILIK]** hanya bisa dikerjakan oleh Anda dan agent akan berhenti di sana sampai selesai.
4. Jangan menempelkan isi `.env.local` atau secret key ke chat mana pun.

### 0.2 Untuk AI Agent — ATURAN EMAS (wajib, berlaku untuk semua model)

1. **Dokumen ini adalah satu-satunya ingatan proyek.** Kamu tidak punya riwayat percakapan sebelumnya dan tidak boleh mengandalkannya. Jika dokumen berbeda dengan kode: untuk *apa yang sudah ada*, kode adalah fakta; untuk *apa yang seharusnya ada*, dokumen adalah acuan. Catat selisihnya di Handoff Log.
2. **Satu task pada satu waktu**, berurutan menurut ID, kecuali dependensi eksplisit memungkinkan urutan lain. Task ukuran **L** dikerjakan per sub-langkah dan dicentang per sub-langkah. Pengecualian: satu prompt pada `prompting-struktur.txt` boleh memuat beberapa task S/M yang berurutan; kerjakan berurutan dan commit per task.
3. **Jangan menebak.** Jika informasi tidak ada, cari berurutan di: kode dan `package.json` → dokumentasi resmi untuk versi yang terpasang (§21) → Log Keputusan (§4) → Pertanyaan Terbuka (§19). Jika masih tidak jelas, pilih opsi yang paling aman dan mudah dibatalkan, catat di Handoff Log bagian *Asumsi*, lalu lanjutkan. Berhenti hanya untuk task **[PEMILIK]** atau blocker nyata.
4. **Verifikasi sebelum mengklaim selesai.** Jalankan gate pada §0.7. Jangan menulis "selesai" jika gate gagal atau belum dijalankan.
5. **Repository harus bisa di-build di akhir setiap sesi.** Jangan meninggalkan file setengah jadi yang merusak build. Jika terpaksa berhenti di tengah task (misalnya kuota habis), ikuti §0.8.
6. **Keamanan tidak bisa ditawar.** Lihat larangan keras di §0.5.
7. **Jangan menambah scope.** Fitur di luar §5.1 tidak dibuat. Ide tambahan dicatat di §18, bukan dikerjakan.
8. **Jangan menambah dependensi di luar whitelist §10.1** tanpa mencatat alasannya sebagai keputusan baru di §4.
9. **Skema database hanya berubah lewat file migration baru.** Migration yang sudah di-push tidak boleh diedit; buat migration berikutnya.
10. **Hemat konteks.** Jangan membaca seluruh dokumen setiap sesi. Baca hanya bagian yang ditunjuk peta di §0.4.

### 0.3 Alur setiap sesi

**Mulai sesi**

1. Baca `AGENTS.md` (jangan dihapus atau ditimpa; hanya bagian Hairy Hijab yang ditambahkan, lihat Lampiran A).
2. Baca §0 (halaman ini) dan blok **§1 STATUS SAAT INI**.
3. Baca 5 entri terakhir di **Lampiran D (Handoff Log)** dan baris terakhir **Lampiran E (Ledger Prompt)**. Jika ada entri berstatus `WIP`, lanjutkan dari "Langkah berikutnya" pada entri itu.
4. Jalankan `git status` dan `git log --oneline -5`. Jika ada perubahan yang belum dikomit dan tidak dijelaskan di Handoff Log, periksa dulu sebelum menimpanya.
5. Jalankan gate G2 (§0.7). Jika gagal sebelum kamu mengubah apa pun, perbaiki itu lebih dulu sebagai task `P-FIX` dan catat penyebabnya.

**Selama bekerja**

6. Ambil task di §1 yang berstatus "Task berikutnya". Baca bagian dokumen yang ditunjuk task tersebut.
7. Kerjakan sesuai "Kerjakan", lalu cocokkan dengan "Selesai jika".
8. Commit kecil dan sering (lihat §0.9).

**Akhir sesi (wajib, termasuk saat kuota hampir habis)**

9. Jalankan gate. Centang task (`[x]`) hanya jika semua kriteria "Selesai jika" terpenuhi.
10. Perbarui blok **§1 STATUS SAAT INI**.
11. Tambahkan satu entri di **Lampiran D** memakai template Lampiran C.
12. Commit (jika diizinkan). Jika tidak bisa commit, tulis "BELUM DIKOMIT" beserta daftar file di Handoff Log.

### 0.4 Peta bacaan per jenis task

Dokumen ini panjang. Jangan membacanya utuh: cari bagian dengan `grep -n '^## \|^### ' docs/PROJECT_PLAN.md`, lalu baca hanya rentang barisnya.

| Jenis task | Baca bagian |
|---|---|
| Setup dan tooling (P0) | §0, §3, §10 |
| UI, komponen, halaman (P1, P4, P5, P9) | §6, §8, §12, §13 |
| Database, migration, RLS (P2) | §4, §9, §11 |
| Auth dan akun (P3) | §7, §10.5, §10.6 |
| Keranjang dan checkout (P5, P6) | §4, §9, §10.4, §11.5 |
| Pembayaran dan pengiriman (P7) | §9, §14 |
| Admin (P8) | §7, §10.4, §11.6 |
| Pengujian dan hardening (P10) | §16, §0.5 |
| Deployment (P11) | §20, §21 |

### 0.5 Larangan keras

- Jangan mencetak, mengomit, atau menempelkan nilai `SUPABASE_SECRET_KEY` atau isi file `.env*` ke chat, log, issue, atau file yang dikomit.
- Jangan memakai `lib/supabase/admin.ts` di luar daftar izin pada §10.5.
- Jangan percaya role, harga, total, status pembayaran, atau `user_id` yang dikirim browser. Semua diturunkan ulang di server.
- Jangan mematikan RLS, jangan menulis policy `using (true)` pada tabel non-publik, jangan memberi `grant` lebih luas dari matriks §11.7.
- Jangan memakai tipe `float` atau `numeric` desimal untuk uang. Rupiah disimpan sebagai `integer`.
- Jangan mengubah stok lewat `update` langsung. Stok hanya berubah lewat fungsi database pada §11.5.
- Jangan menghapus atau menimpa `AGENTS.md` bawaan.
- Jangan menghapus file yang bukan hasil pekerjaanmu tanpa mencatat alasannya di Handoff Log.
- Jangan menjalankan `git push --force`, `git reset --hard`, atau `git clean -fd` tanpa instruksi eksplisit pemilik.
- Jangan mengarang konten hukum, kebijakan, data produk, harga, klaim bisnis, atau testimoni. Tandai `TODO(owner)`.
- Jangan membuat fitur "sementara" yang melewati otorisasi (misalnya admin tanpa guard) dengan niat memperbaikinya nanti.

### 0.6 Definisi Selesai (Definition of Done) untuk setiap task

- [ ] Semua poin "Selesai jika" pada task terpenuhi.
- [ ] Gate G1 lulus (G2 untuk akhir fase).
- [ ] Tidak ada `console.log` debug, tidak ada kode yang dikomentari tanpa alasan, tidak ada `any` tanpa komentar alasan.
- [ ] Tidak ada `TODO` tanpa ID (`TODO(P4-03)` atau `TODO(owner)`).
- [ ] Input dari pengguna divalidasi dengan Zod di server; akses data dibatasi sesuai §7 dan §11.7.
- [ ] Checkbox task, blok STATUS, dan Handoff Log sudah diperbarui.

### 0.7 Perintah gate

| Gate | Perintah | Kapan |
|---|---|---|
| **G1** | `npm run lint && npm run typecheck && npm run test` | Setiap task |
| **G2** | G1 + `npm run build` | Akhir setiap fase dan awal sesi |
| **G3** | `npm run test:rls` (butuh `.env.local` yang valid) | Setiap perubahan database dan akhir Fase 2, 7, 8, 10 |
| **G4** | `npm run test:e2e` | Akhir Fase 6, 8, 10 |

Sebelum task P0-07 selesai, script `typecheck` dan `test` belum ada. Pada masa itu gunakan `npm run lint`, `npx tsc --noEmit`, dan `npm run build`.

### 0.8 Jika kuota atau konteks habis di tengah task

1. Hentikan perubahan baru. Pastikan build tidak rusak; jika rusak dan tidak sempat diperbaiki, `git stash` atau revert perubahan task yang setengah jadi.
2. Tulis entri Handoff Log dengan status **WIP**: apa yang sudah selesai (sub-langkah yang dicentang), file yang disentuh, dan **satu kalimat "Langkah berikutnya" yang konkret** (nama file dan fungsi).
3. Model atau akun pengganti membaca entri itu dan melanjutkan. Karena semua keputusan tertulis di dokumen ini, pergantian model tidak mengubah hasil.

### 0.9 Konvensi Git

- Branch: `feat/<fase>-<slug>` (contoh `feat/p4-catalog`), `fix/<slug>`, `chore/<slug>`. Merge ke branch utama setelah gate G2 lulus.
- Satu commit per task atau per sub-langkah task L. Format: `feat(P4-02): halaman katalog dengan filter` / `fix(P6-05): ...` / `chore(P0-04): ...` / `db(P2-05): ...`.
- Tag rilis: `v0.x.0` per akhir fase, `v1.0.0` saat go-live (P11-06).

### 0.10 Penanda yang dipakai di dokumen

| Penanda | Arti |
|---|---|
| **[PEMILIK]** | Hanya manusia pemilik yang dapat mengerjakan (akun, secret, data bisnis). Agent berhenti dan melaporkan. |
| **[DEV ONLY]** | Hanya untuk lingkungan pengembangan; jangan dijalankan di produksi. |
| `TODO(owner)` | Butuh keputusan atau data dari pemilik. |
| **S / M / L** | Ukuran task: S = 1–2 file, M = 3–6 file, L = banyak file; wajib dipecah per sub-langkah. |

### 0.11 Alur prompt, `/1allclear`, dan Ledger

- Pemilik menjalankan pekerjaan lewat prompt berurutan di `prompting-struktur.txt` (53 prompt; setiap prompt menunjuk task di §15). Setiap prompt memuat aturan ini sendiri sehingga tetap berlaku saat model atau akun diganti.
- Setelah selesai, agent menulis status **MENUNGGU** pada baris prompt tersebut di **Lampiran E**. Hanya pemilik yang dapat mengubahnya menjadi **DISETUJUI**, yaitu dengan mengawali prompt berikutnya dengan `/1allclear` (`1allclear` dan `[1allclear]` dianggap sama karena sebagian CLI memperlakukan awalan `/` sebagai slash command) atau dengan Prompt Persetujuan.
- Agent yang menerima `/1allclear` menandai prompt sebelumnya **DISETUJUI** lalu mengerjakan prompt baru. Tanpa `/1allclear`, bila prompt sebelumnya belum DISETUJUI, agent **berhenti dan bertanya**; ia tidak lanjut diam-diam.
- Pengulangan prompt yang sama atau Prompt Perbaikan adalah **percobaan ulang**: kolom *Percobaan* naik dan penyebab kegagalan dicatat di *Riwayat percobaan*. Percobaan ke-3 atau lebih mewajibkan analisis akar masalah (kode, plan, atau lingkungan) **sebelum** kode diubah.
- Prompt dengan percobaan terbanyak menunjukkan alur yang bermasalah. Prompt Diagnosa merangkumnya dan mengusulkan perbaikan teks plan.

---

## 1. STATUS SAAT INI

> **Agent: perbarui blok ini di akhir setiap sesi.** Jangan ubah struktur blok.

```text
Versi dokumen        : 2.0
Fase aktif           : Fase 0 — Audit dan Fondasi Repo
Task berikutnya      : P0-08
Prompt aktif         : 05 → MENUNGGU persetujuan; prompt berikutnya: 06 (lihat Lampiran E)
Task terakhir selesai: P0-05
Blocker aktif        : tidak ada
Menunggu pemilik     : lihat §19 (D-06, D-10, D-11 perlu konfirmasi sebelum Fase 6)
Terakhir diperbarui  : 2026-10-21 oleh Claude Opus 4.6 (Thinking)
```

**Progres per fase** (agent menghitung dari checkbox pada §15):

| Fase | Nama | Task | Selesai |
|---|---|---:|---:|
| 0 | Audit dan Fondasi Repo | 8 | 7 |
| 1 | Design System dan Layout | 5 | 0 |
| 2 | Database dan Keamanan | 13 | 0 |
| 3 | Autentikasi dan Akun | 5 | 0 |
| 4 | Katalog Publik | 4 | 0 |
| 5 | Keranjang | 3 | 0 |
| 6 | Checkout dan Pesanan | 8 | 0 |
| 7 | Pembayaran Manual dan Pengiriman | 3 | 0 |
| 8 | Dashboard Admin | 10 | 0 |
| 9 | Konten, SEO, Performa, Aksesibilitas | 4 | 0 |
| 10 | Pengujian dan Hardening | 6 | 0 |
| 11 | Deployment dan Peluncuran | 6 | 0 |

---
## 2. Ringkasan Proyek

Hairy Hijab adalah website e-commerce penjualan hijab dengan delapan kategori produk. Struktur katalog dan pengalaman belanja terinspirasi dari ZM Zaskia Mecca (referensi visual dari pemilik), dengan identitas merek, konten, foto, dan elemen desain milik Hairy Hijab sendiri. Jangan menyalin teks, foto, atau aset dari situs referensi.

Tahap pertama dibangun sebagai **single-store e-commerce**. Kode dan database disiapkan agar bisa menjadi **SaaS multi-tenant** kelak, tetapi `tenant_id` dan billing **tidak** dibuat pada MVP (lihat D-01 dan §18).

### 2.1 Tujuan

1. Katalog hijab online yang profesional dan responsif.
2. Pengelolaan produk, varian, harga, dan stok oleh admin tanpa mengubah kode.
3. Keranjang, checkout, pesanan, pembayaran (transfer manual terverifikasi), dan pengiriman.
4. Dashboard admin untuk operasional harian.
5. Fondasi teknis yang aman, terukur, dan mudah dipelihara oleh developer maupun agent AI.
6. Jalur pengembangan ke SaaS untuk toko lain.

### 2.2 Sasaran keberhasilan (dapat diuji)

| # | Sasaran | Cara membuktikan |
|---|---|---|
| S1 | Pelanggan dapat menyelesaikan alur katalog → keranjang → checkout → halaman pesanan | Tes E2E (P10-04) |
| S2 | Dua pesanan serentak untuk satu stok terakhir: tepat satu berhasil | Tes konkurensi (P10-03) |
| S3 | Mengubah harga atau total dari browser tidak memengaruhi total pesanan | Tes server action (P6-08) |
| S4 | Pesanan tidak menjadi `paid` tanpa verifikasi staf | Tes RLS dan fungsi (P2-12, P10-02) |
| S5 | Pelanggan tidak dapat membaca pesanan orang lain; non-admin tidak dapat membuka `/admin` | Tes matriks izin (P10-02) |
| S6 | Data pesanan lama tetap akurat setelah produk diubah atau dinonaktifkan | Tes snapshot (P6-08) |
| S7 | Admin dapat mengelola kategori, produk, varian, stok, dan pesanan tanpa menyentuh kode | Uji manual (P8) |
| S8 | Tampilan dapat dipakai di ponsel, tablet, dan desktop; skor aksesibilitas Lighthouse ≥ 90 | P9-04 |
| S9 | Tidak ada secret di bundle klien | Pemindaian bundle (P10-05) |

---

## 3. Fakta Lingkungan dan Hasil Audit Rancangan Awal

### 3.1 Fakta dari screenshot VS Code (kondisi repository saat revisi)

| Observasi | Konsekuensi untuk rencana |
|---|---|
| Workspace `Project Website Hairy Hijab` berisi folder `hairy/` (aplikasi Next.js) dan file plan di root workspace | Aplikasi berada di `hairy/`. Semua path pada dokumen ini relatif terhadap `hairy/` kecuali disebut lain. |
| Folder `app/` berada langsung di `hairy/`. **Tidak ada folder `src/`** | Rancangan awal memakai `src/app/...` dan **salah** untuk repo ini. Struktur diganti ke tanpa `src/` (D-02). Alias `@/*` harus menunjuk ke `./*`. |
| Ada `AGENTS.md`, `README.md`, `eslint.config.mjs`, `next.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json` | Scaffold dari `create-next-app`. `AGENTS.md` bawaan dipertahankan; bagian Hairy Hijab ditambahkan di bawahnya (Lampiran A). |
| **Tidak terlihat** `postcss.config.mjs` atau konfigurasi Tailwind | ~~Tailwind kemungkinan belum terpasang.~~ **P0-01 membuktikan Tailwind v4.3.3 sudah terpasang** lewat `@tailwindcss/turbopack` (bukan PostCSS). `globals.css` sudah `@import "tailwindcss"`. P0-03 hanya perlu memverifikasi dan mungkin menambah `@tailwindcss/postcss` + `postcss` untuk build produksi jika `next build` memerlukannya. |
| Belum ada `components/`, `lib/`, `supabase/`, `tests/`, `proxy.ts` | Proyek masih greenfield; tidak ada kode yang perlu dimigrasikan. |
| Status bar menunjukkan branch `master` dan ekstensi Claude Code aktif; terminal menjalankan agent CLI dengan model yang dapat diganti | Beberapa agent/model akan bergantian. Dokumen ini harus mandiri (model-agnostic). Untuk Claude Code, buat `CLAUDE.md` yang mengimpor `AGENTS.md` (P0-06). |
| File plan berada di luar `hairy/` | Bisa tidak ikut ter-commit. Dipindahkan ke dalam repo (P0-06). |

**Tabel fakta yang diisi agent pada P0-01** (jangan diisi dari asumsi; baca dari `package.json`, `node -v`, `git`):

| Item | Nilai terverifikasi |
|---|---|
| Node.js | v24.21.0 (≥ 20.9 ✔) |
| npm | 11.19.0 |
| next | 16.4.2 (≥ 16 ✔ — `proxy.ts` sesuai rencana) |
| react / react-dom | 19.3.0 / 19.3.0 |
| typescript | 5.9.3 (strict ✔ di tsconfig.json) |
| tailwindcss (ada/tidak, versi) | **Ada**, v4.3.3 via `@tailwindcss/turbopack` (bukan `@tailwindcss/postcss`). `globals.css` sudah `@import "tailwindcss"`. Tidak ada `postcss.config.mjs`. Lihat catatan selisih di Lampiran D. |
| eslint / eslint-config-next | 9.39.5 / 16.4.2 |
| Alias `@/*` pada `tsconfig.json` | `"@/*": ["./*"]` ✔ (tanpa `src/`) |
| Lokasi `.git` (root workspace atau `hairy/`) | `hairy/` (git root = `C:/Users/hp/Documents/Hairy Hijab/Project Website Hairy Hijab/hairy`) |
| Branch utama | `master` ✔ |
| Isi `AGENTS.md` bawaan (ringkas 2–3 baris) | Blok `nextjs-agent-rules`: peringatan bahwa Next.js versi ini memiliki breaking changes, arahkan membaca docs di `node_modules/next/dist/docs/`. Dikelola otomatis oleh `next dev`. |

### 3.2 Fakta teknologi yang diverifikasi pada 20 Oktober 2026

Periksa ulang terhadap tautan di §21 saat mengimplementasikan; dokumentasi bergerak cepat.

| Topik | Fakta | Dampak |
|---|---|---|
| Next.js 16 | `middleware.ts` diganti `proxy.ts` (export bernama `proxy`), berjalan di runtime Node.js; `middleware.ts` masih berjalan tetapi deprecated. Node.js minimal 20.9. | Rancangan awal tidak menyebut ini. Sesi Supabase di-refresh lewat `proxy.ts` (P3-01). Jika versi terpasang < 16, pakai `middleware.ts` dan catat di §4. |
| Next.js ≥ 15 | `params`, `searchParams`, `cookies()`, dan `headers()` bersifat asinkron (Promise). | Selalu `await`. Kesalahan ini sering terjadi pada kode hasil AI. |
| Supabase SSR | Server memakai `supabase.auth.getClaims()` untuk melindungi halaman; **jangan** memercayai `getSession()` di kode server. Kunci baru: `sb_publishable_...` dan `sb_secret_...`; kunci lama `anon`/`service_role` dijadwalkan deprecated akhir 2026. | Env var memakai nama pada §10.7. |
| Supabase Data API | Tabel baru di schema `public` **tidak otomatis** dapat diakses Data API; perlu `GRANT` eksplisit. Berlaku default untuk project baru sejak 30 Mei 2026 dan untuk semua project mulai 30 Oktober 2026. | Rancangan awal tidak punya `GRANT` sama sekali. Semua migration wajib `GRANT` eksplisit (§11.7). |
| Supabase Auth email | Layanan email bawaan hanya untuk pengujian dengan pembatasan ketat. | Pasang SMTP sendiri sebelum peluncuran (P11-03). |
| Supabase paket gratis | Project bisa dijeda saat tidak aktif dan cadangan terbatas. | Produksi memakai paket berbayar (R-09, P11-05). |

### 3.3 Temuan cross-check terhadap Rancangan Awal 1.0

Tingkat: **K** = kritis (menyebabkan bug keamanan atau kegagalan build), **T** = tinggi, **S** = sedang, **R** = rendah.

| ID | Tk | Temuan pada Rancangan Awal | Perbaikan pada Edisi 2.0 |
|---|:-:|---|---|
| A-01 | K | Struktur memakai `src/app/...`; repo nyata memakai `app/` tanpa `src/`. | Struktur ulang tanpa `src/` (§10.2, D-02). |
| A-02 | K | Tidak ada `GRANT`; padahal tabel baru tidak lagi terbuka ke Data API. Migration akan lolos tetapi aplikasi mendapat error `42501`. | Matriks `GRANT` eksplisit + tes (§11.7, P2-07, P2-12). |
| A-03 | K | Tidak ada `proxy.ts`/refresh sesi; tidak menyebut `getClaims()`. Sesi login akan kedaluwarsa tanpa pembaruan. | §10.6, P3-01. |
| A-04 | K | `profiles.role` ada di tabel yang dapat di-update pelanggan; mitigasi hanya berupa catatan. Risiko eskalasi ke admin. | Role dipindah ke tabel `staff_roles` tanpa kebijakan tulis untuk klien (D-05, §11.4). |
| A-05 | K | Fungsi RPC di schema `public` secara default dapat dieksekusi semua role. Pembuatan pesanan dan perubahan stok bisa dipanggil langsung dari browser. | `REVOKE EXECUTE` lalu `GRANT` selektif (§11.7). |
| A-06 | T | Keputusan penting dibiarkan terbuka: kapan stok dikurangi, metode pembayaran, ongkir, guest checkout, kedaluwarsa pesanan. Agent akan memilih berbeda-beda. | Diputuskan di §4 (D-06 s.d. D-11, D-25). |
| A-07 | T | Uang memakai `Numeric`. Rupiah tidak berdesimal; `numeric` mengundang float di JavaScript. | `integer` rupiah penuh (D-04). |
| A-08 | T | Tidak ada model keranjang, tidak ada idempotency key, tidak ada riwayat status pesanan. `payments` dan `shipments` hanya disebut tanpa kolom. | Keranjang client-side (D-07); kolom lengkap, `idempotency_key`, `order_status_history` (§11.4). |
| A-09 | T | Pembuatan pesanan + pengurangan stok tidak punya desain atomik konkret. | Fungsi `create_order` lengkap dengan penguncian baris (§11.5). |
| A-10 | T | Admin dapat meng-`update` kolom stok langsung menurut desain tabel; riwayat `stock_movements` bisa tidak sinkron. | Grant kolom tanpa `stock_quantity`; stok hanya lewat fungsi (§11.7). |
| A-11 | S | Inkonsistensi rute: `/cart` dan `/checkout` ada di pohon folder tetapi tidak di peta halaman; halaman kebijakan ada di peta tetapi tidak di pohon; tidak ada halaman konfirmasi/instruksi pembayaran/pelacakan pesanan tamu. | Peta rute tunggal (§8) dengan `/orders/[orderNumber]` (D-24). |
| A-12 | S | "Diskon" ada di MVP checkout, tetapi voucher/promo ditaruh di tahap lanjutan. Kontradiksi. | MVP memakai harga coret saja; `discount_amount` = 0 (D-12). |
| A-13 | S | "Varian ukuran: Sesuai produk" ambigu; Pashmina Bandana punya "atribut produk" tanpa definisi; Two Tone butuh dua warna. | `requires_size`, `size_options`, `specs`, `color_hex_2` (§6, §11.4). |
| A-14 | S | Route `/admin/variants`, `/admin/payments`, `/admin/shipments` terpisah dari konteksnya (varian milik produk; pembayaran dan pengiriman milik pesanan). | Digabung ke halaman produk dan detail pesanan (D-14, §8.4). |
| A-15 | S | Webhook `/api/webhooks/payments` ada di pohon folder padahal MVP memakai transfer manual. | Ditunda sampai gateway dipilih (D-10). |
| A-16 | S | Storage hanya disebut; bucket, batas ukuran, tipe file, dan akses bukti transfer tidak ditentukan. | §11.8, D-19. |
| A-17 | S | Pencarian "ada" tetapi tanpa strategi teknis; tidak ada pagination. | ILIKE + pg_trgm, 24 per halaman, parameter URL (D-13). |
| A-18 | S | Tidak ada kriteria selesai, tracker, atau protokol serah-terima; estimasi hari untuk "satu developer" tidak berguna bagi agent. | §0, §1, §15, Lampiran A–D. |
| A-19 | S | Palet warna: Gold (≈2,4:1) dan Taupe (≈3:1) di atas Ivory tidak memenuhi kontras teks 4,5:1. | Aturan pemakaian dan token tambahan (§12.2). |
| A-20 | R | Gambar disimpan sebagai `image_url` penuh; berubah jika domain/project berganti. | Simpan `storage_path` (§11.4). |
| A-21 | R | `.env.local` tercantum di pohon folder seolah file proyek. | Hanya `.env.example` yang ada di repo (§10.7). |
| A-22 | R | Tidak ada format nomor pesanan, zona waktu, atau bahasa UI. | `HH-YYMMDD-XXXXX`, simpan UTC tampil Asia/Jakarta, UI Indonesia (D-16, §11.5). |

---

## 4. Log Keputusan

Status: **LOCKED** = jangan diubah tanpa persetujuan pemilik. **DEFAULT** = dipilih agar pekerjaan tidak terhambat; pemilik dapat mengubahnya dan dampaknya tertulis. Keputusan baru ditambahkan di bawah dengan ID berikutnya.

| ID | Keputusan | Status | Dampak bila diubah |
|---|---|---|---|
| D-01 | Single-store MVP. Tidak ada `tenant_id`, billing, atau multi-toko sebelum toko inti stabil. | LOCKED | Lihat §18 tahap 3. |
| D-02 | Struktur proyek **tanpa `src/`** (sesuai repo). Alias `@/*` → `./*`. | LOCKED | Ubah seluruh path. |
| D-03 | Next.js 16.x App Router + TypeScript strict; `proxy.ts` untuk sesi. Jika P0-01 menemukan versi < 16, pakai `middleware.ts` dan catat. | LOCKED | — |
| D-04 | Uang = `integer` rupiah penuh. Tampil `Rp 125.000` lewat `Intl.NumberFormat('id-ID')`. | LOCKED | Migrasi data. |
| D-05 | Role di tabel `staff_roles` (`admin` / `staff`), **bukan** di `profiles`. Pemberian role hanya lewat SQL oleh pemilik. | LOCKED | — |
| D-06 | **Guest checkout diizinkan.** Pesanan dibuat server; tamu melihat pesanan lewat `/orders/[orderNumber]?token=...`. | DEFAULT | Jika login diwajibkan: P6-04, P6-05, P6-06 disederhanakan, `public_token` tetap disimpan. |
| D-07 | Keranjang **client-side** (Zustand + persist, kunci `hairy-cart-v1`), hanya menyimpan `{variantId, quantity}`. Harga dan stok selalu diambil ulang dari server. Tidak ada tabel `carts`. | LOCKED | — |
| D-08 | Stok **dikurangi saat pesanan dibuat** (reservasi atomik, `stock_movements.reserve`) dan **dikembalikan** saat batal/kedaluwarsa (`release`). Tidak dikurangi lagi saat dibayar. | LOCKED | Ubah fungsi §11.5. |
| D-09 | Pesanan `pending` + `unpaid` kedaluwarsa **24 jam** (`store_settings.payment_expiry_hours`). Pesanan dengan bukti transfer terkirim (`proof_submitted`) **tidak** kedaluwarsa otomatis. Pembersihan oleh pg_cron tiap 15 menit. | DEFAULT | Ubah angka di pengaturan. |
| D-10 | **Pembayaran MVP: transfer bank manual** + unggah bukti + verifikasi staf. Payment gateway (Midtrans/Xendit) = tahap 2. Tabel `payments` sudah netral terhadap provider. | DEFAULT | Tambah webhook, verifikasi signature, idempotensi (§14.1). |
| D-11 | **Ongkir MVP: tarif flat per provinsi** dari tabel `shipping_rates` dengan baris default `*`. Ditampilkan sebagai "Tarif flat", bukan real-time. Kurir dan resi diisi staf. | DEFAULT | Integrasi Biteship/RajaOngkir = tahap 2 lewat antarmuka `ShippingProvider`. |
| D-12 | Tidak ada voucher di MVP. Promo = harga coret (`compare_at_price` > `price`). `orders.discount_amount` selalu 0. | LOCKED | Tabel `promotions` di tahap 2. |
| D-13 | Pencarian: `ILIKE` + indeks trigram pada `products.name`. Filter: kategori, ukuran, warna, rentang harga. Urut: terbaru, harga naik/turun. 24 produk per halaman; state di URL. | LOCKED | — |
| D-14 | Varian dikelola di halaman edit produk. Tidak ada `/admin/variants`. | LOCKED | — |
| D-15 | Tidak ada hapus keras untuk produk/varian yang pernah dipesan; gunakan `is_active = false`. | LOCKED | — |
| D-16 | UI berbahasa Indonesia; kode dan identifier berbahasa Inggris. Simpan waktu dalam UTC (`timestamptz`), tampilkan Asia/Jakarta. | LOCKED | — |
| D-17 | Hanya dependensi pada whitelist §10.1. | LOCKED | Catat tambahan di sini. |
| D-18 | Mutasi lewat **Server Actions**. Route Handler hanya untuk `/auth/callback` (dan webhook kelak). Setiap action memeriksa otorisasi sendiri. | LOCKED | — |
| D-19 | Bucket `product-images` (publik) dan `payment-proofs` (privat). Bukti transfer diunggah hanya oleh server. | LOCKED | — |
| D-20 | Unit test: Vitest. E2E: Playwright. Tes keamanan database: skrip Vitest terhadap project Supabase dev. | LOCKED | — |
| D-21 | Skema hanya lewat migration (`supabase/migrations`) dengan Supabase CLI. **Dua project Supabase**: dev dan produksi. | LOCKED | — |
| D-22 | `SUPABASE_SECRET_KEY` hanya di server; admin client hanya di tempat yang diizinkan §10.5. Agent tidak pernah mencetak secret. | LOCKED | — |
| D-23 | shadcn/ui dipakai untuk komponen dasar. | LOCKED | — |
| D-24 | Satu halaman pesanan kanonik: `/orders/[orderNumber]`, dapat diakses pemilik pesanan (sesi) atau pemegang token. `/account/orders` hanya daftar yang menautkan ke sana. | LOCKED | — |
| D-25 | Pesanan yang sudah kedaluwarsa tetapi dibayar belakangan ditangani manual (hubungi pelanggan / refund). Fitur "buka kembali pesanan" = tahap 2. | DEFAULT | Tambah fungsi `reopen_order`. |

---

## 5. Ruang Lingkup

### 5.1 MVP (dikerjakan)

- Beranda dan navigasi; katalog; halaman kategori; pencarian, filter, urutan.
- Detail produk dengan galeri, varian (ukuran/warna), harga, harga coret, stok, status **Sold Out**.
- Keranjang; checkout (tamu dan pelanggan); alamat pengiriman; ongkir flat; nomor pesanan.
- Halaman pesanan dengan instruksi transfer, batas waktu, unggah bukti transfer, dan status.
- Registrasi/login pelanggan; profil; buku alamat; riwayat pesanan.
- Dashboard admin: ringkasan, kategori, produk, varian, gambar, inventori dan riwayat stok, pesanan (verifikasi pembayaran, pengiriman, pembatalan), pelanggan (baca saja), pengaturan toko dan tarif ongkir.
- Halaman informasi dan kebijakan; SEO dasar; keamanan database (RLS, GRANT, validasi); deployment dan pengujian produksi.
- Tombol "Hubungi via WhatsApp" (tautan `wa.me`, tanpa API).

### 5.2 Tahap lanjutan (tidak dikerjakan sekarang)

Wishlist, ulasan, voucher dan promosi, notifikasi email/WhatsApp otomatis, payment gateway, ongkir otomatis, laporan dan ekspor, kode unik transfer, buka kembali pesanan kedaluwarsa, multi-tenant dan billing.

### 5.3 Di luar cakupan

Marketplace banyak penjual, aplikasi mobile native, ERP, program loyalitas, otomatisasi logistik tanpa integrasi pihak ketiga.

---
## 6. Katalog dan Kategori Produk

### 6.1 Delapan kategori (data referensi, dibuat oleh migration 0009)

| No. | Nama | Slug | `requires_size` | `size_options` | Catatan |
|---|---|---|:-:|---|---|
| 1 | Bergo Non Karet | `bergo-non-karet` | ya | `S`, `M` | Varian = ukuran × warna |
| 2 | Bergo Karet | `bergo-karet` | ya | `S`, `M` | Varian = ukuran × warna |
| 3 | Pashmina Kaos Rayon | `pashmina-kaos-rayon` | tidak | — | Varian umumnya per warna |
| 4 | Pashmina Viscose | `pashmina-viscose` | tidak | — | Varian umumnya per warna |
| 5 | Pashmina Bandana | `pashmina-bandana` | tidak | — | Varian per warna; atribut tambahan di `products.specs` |
| 6 | Bergo Bandana | `bergo-bandana` | ya | `S`, `M` | Varian = ukuran × warna |
| 7 | Bergo Bandana Two Tone | `bergo-bandana-two-tone` | ya | `S`, `M` | Warna ganda: `color_name` gabungan dan `color_hex_2` |
| 8 | Paris Jadul | `paris-jadul` | tidak | — | Ukuran opsional (teks bebas) bila produk punya beberapa ukuran |

### 6.2 Aturan katalog

- Kategori mengelompokkan produk; produk tidak diduplikasi antar kategori. Satu produk punya tepat satu kategori.
- Setiap produk punya satu atau lebih **varian**. Yang dibeli, dihargai, dan distok adalah varian.
- Varian dibedakan oleh `size`, `color_name`, atau kombinasi keduanya. Kombinasi `(product_id, size, color_name)` unik (NULL dianggap sama).
- Jika kategori `requires_size = true`, form admin mewajibkan ukuran dari `size_options`. Jika `false`, kolom ukuran opsional dan bebas.
- Setiap varian punya SKU unik, harga, status aktif, dan stok. Harga coret (`compare_at_price`) opsional dan harus lebih besar dari harga.
- Produk dengan semua varian stok 0 tampil dengan label **Sold Out** (tidak disembunyikan, kecuali dinonaktifkan admin).
- Produk, varian, atau kategori nonaktif tidak tampil di katalog publik dan tidak dapat dipesan.
- Informasi bahan, dimensi, dan perawatan hanya diisi dari data yang benar milik pemilik. Jangan dikarang.
- Foto produk disimpan di Storage; yang disimpan di database adalah `storage_path`, bukan URL penuh.

---

## 7. Peran dan Otorisasi

### 7.1 Peran

| Peran | Sumber penentuan | Kemampuan |
|---|---|---|
| Pengunjung (anon) | Tanpa login | Baca data publik; checkout sebagai tamu lewat server |
| Pelanggan | Login Supabase Auth | Kelola profil dan alamat sendiri; lihat pesanan sendiri |
| Staf (`staff`) | Baris di `staff_roles` | Baca semua pesanan; verifikasi/tolak pembayaran; input pengiriman; batalkan pesanan; sesuaikan stok; baca katalog termasuk nonaktif |
| Admin (`admin`) | Baris di `staff_roles` | Semua kemampuan staf + kelola kategori, produk, varian, gambar, tarif ongkir, pengaturan toko, lihat pelanggan |
| Platform admin | — | Tahap SaaS saja (§18) |

### 7.2 Aturan otorisasi

1. Role selalu diperiksa di server dan di database, tidak pernah dari nilai yang dikirim browser.
2. Pemeriksaan di layout atau UI **tidak cukup**: setiap Server Action dan setiap fungsi database admin memeriksa sendiri (`requireStaff()`/`requireAdmin()` dan `is_staff()`/`is_admin()`).
3. Server Action adalah endpoint POST publik; anggap dapat dipanggil siapa saja.
4. Pelanggan membaca data miliknya lewat klien sesi dengan RLS. Tamu hanya dapat melihat pesanan lewat jalur token di server (`services/orders.public.service.ts`).
5. Pembuatan pesanan, perubahan stok, dan perubahan status pembayaran tidak dapat dilakukan langsung dari klien; hanya lewat fungsi database yang dibatasi (§11.5–11.7).
6. Penetapan role admin pertama dilakukan pemilik lewat SQL (P3-05). Tidak ada UI untuk menaikkan role di MVP.
7. Secret key tidak pernah dikirim ke browser dan tidak diberi awalan `NEXT_PUBLIC_`.

---

## 8. Peta Halaman

Kolom **Fase** menunjukkan task yang membuat halaman itu. Rute adalah rancangan; ikuti konvensi routing versi Next.js yang terpasang.

### 8.1 Publik (grup `(store)`)

| Halaman | Route | Fungsi | Fase |
|---|---|---|---|
| Beranda | `/` | Hero, kategori, produk terbaru/unggulan, promo | P1-05, P4-04 |
| Semua produk | `/products` | Katalog dengan filter dan urutan | P4-02 |
| Detail produk | `/products/[slug]` | Galeri, varian, harga, stok, tombol beli | P4-03 |
| Kategori | `/categories/[slug]` | Produk per kategori | P4-02 |
| Promo | `/sale` | Produk dengan harga coret | P4-02 |
| Pencarian | `/search?q=` | Hasil pencarian | P4-02 |
| Keranjang | `/cart` | Ringkasan keranjang | P5-03 |
| Checkout | `/checkout` | Data pembeli, alamat, ringkasan, buat pesanan | P6-04 |
| Pesanan | `/orders/[orderNumber]` | Status, instruksi transfer, unggah bukti (akses: pemilik atau `?token=`) | P6-06 |
| Tentang | `/about` | Profil merek | P9-01 |
| Panduan ukuran | `/size-guide` | Panduan ukuran | P9-01 |
| Panduan perawatan | `/care-guide` | Perawatan bahan | P9-01 |
| Kontak | `/contact` | Kontak resmi + WhatsApp | P9-01 |
| Kebijakan privasi | `/privacy-policy` | — | P9-01 |
| Syarat layanan | `/terms` | — | P9-01 |
| Kebijakan pengiriman | `/shipping-policy` | — | P9-01 |
| Kebijakan pengembalian | `/returns-policy` | — | P9-01 |

### 8.2 Autentikasi (grup `(auth)` dan `/auth`)

| Halaman | Route | Fase |
|---|---|---|
| Login | `/login` | P3-03 |
| Registrasi | `/register` | P3-03 |
| Lupa kata sandi | `/forgot-password` | P3-03 |
| Reset kata sandi | `/reset-password` | P3-03 |
| Callback | `/auth/callback` (Route Handler) | P3-03 |

### 8.3 Pelanggan

| Halaman | Route | Fase |
|---|---|---|
| Ringkasan akun | `/account` | P3-04 |
| Profil | `/account/profile` | P3-04 |
| Alamat | `/account/addresses` | P3-04 |
| Daftar pesanan | `/account/orders` (menautkan ke `/orders/[orderNumber]`) | P6-07 |

### 8.4 Admin (MVP)

| Halaman | Route | Fase |
|---|---|---|
| Dashboard | `/admin` | P8-02 |
| Kategori | `/admin/categories` | P8-03 |
| Produk | `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit` (varian dan gambar ada di halaman edit) | P8-04 s.d. P8-06 |
| Inventori | `/admin/inventory` | P8-07 |
| Pesanan | `/admin/orders`, `/admin/orders/[id]` (pembayaran, pengiriman, riwayat ada di detail) | P8-08 |
| Pelanggan | `/admin/customers` (baca saja) | P8-10 |
| Pengaturan | `/admin/settings` (toko, rekening, ongkir) | P8-09 |

Ditunda ke tahap 2: `/admin/promotions`, `/admin/reports`, `/account/wishlist`.

---

## 9. Alur Transaksi dan State Machine

### 9.1 Alur pelanggan

1. Pelanggan memilih produk → memilih varian → menambah ke keranjang (client).
2. `/cart` mengambil harga dan stok terbaru dari server; item yang tidak tersedia ditandai.
3. `/checkout`: isi data pembeli dan alamat → server menghitung ongkir → pelanggan menekan "Buat Pesanan".
4. Server Action `placeOrder` memvalidasi input (Zod) → memanggil fungsi database `create_order` dengan admin client → menerima `order_number` dan `public_token`.
5. Pelanggan diarahkan ke `/orders/[orderNumber]?token=...` (atau tanpa token bila login dan pemilik): melihat total, rekening tujuan, batas waktu.
6. Pelanggan mentransfer, lalu mengunggah bukti → `payment_status` = `proof_submitted`.
7. Staf memeriksa bukti → **verifikasi** (→ `paid`, `status` = `processing`) atau **tolak** (→ kembali `unpaid`, pelanggan dapat unggah ulang).
8. Staf mengirim barang dan mengisi kurir/resi → `shipped`. Pelanggan melihat resi di halaman pesanan.
9. Staf menandai selesai → `completed`.

### 9.2 Aturan checkout (semuanya wajib)

- Server menghitung ulang harga, ongkir, dan total dari database. Browser bukan sumber kebenaran.
- Stok divalidasi dan dikurangi atomik di dalam fungsi `create_order` (kunci baris `FOR UPDATE`).
- Pesanan tidak pernah menjadi `paid` karena permintaan browser; hanya fungsi `verify_payment` oleh staf.
- Permintaan berulang dengan `idempotency_key` yang sama mengembalikan pesanan yang sama (tidak membuat ganda).
- Snapshot nama produk, SKU, ukuran, warna, harga satuan, alamat, nama dan telepon pembeli disimpan di pesanan.
- Total pesanan memenuhi `grand_total = subtotal + shipping_cost − discount_amount` (constraint database).
- Batas: 1–20 per baris item, maksimal 30 baris.

### 9.3 Status pesanan (`orders.status`)

| Status | Arti |
|---|---|
| `pending` | Menunggu pembayaran / verifikasi |
| `processing` | Pembayaran terverifikasi, sedang disiapkan |
| `shipped` | Sudah dikirim |
| `completed` | Selesai |
| `cancelled` | Dibatalkan oleh staf |
| `expired` | Kedaluwarsa karena tidak dibayar |

### 9.4 Status pembayaran (`orders.payment_status`)

| Status | Arti |
|---|---|
| `unpaid` | Belum ada bukti yang valid |
| `proof_submitted` | Bukti diunggah, menunggu staf |
| `paid` | Diverifikasi staf |
| `refunded` | Dikembalikan (dicatat manual oleh staf) |

### 9.5 Transisi yang diizinkan

| Dari | Ke | Dilakukan oleh | Syarat | Efek stok |
|---|---|---|---|---|
| `pending` (`unpaid`) | `pending` (`proof_submitted`) | server (`submit_payment_proof`) | Pesanan belum kedaluwarsa | — |
| `pending` (`proof_submitted`) | `processing` (`paid`) | staf (`verify_payment`) | — | tetap (sudah direservasi) |
| `pending` (`proof_submitted`) | `pending` (`unpaid`) | staf (`reject_payment`) | Catatan penolakan | — |
| `pending` (`unpaid`) | `expired` | pg_cron (`expire_unpaid_orders`) | `expires_at` lewat | **dikembalikan** |
| `pending` / `processing` | `cancelled` | staf (`cancel_order`) | Alasan | **dikembalikan** |
| `processing` | `shipped` | staf (`mark_order_shipped`) | — | — |
| `shipped` | `completed` | staf (`complete_order`) | — | — |
| `cancelled` (`paid`) | `cancelled` (`refunded`) | staf (`mark_refunded`) | Pengembalian dana dilakukan di luar sistem | — |

Transisi lain ditolak dengan error `INVALID_TRANSITION`. Status `completed`, `cancelled`, dan `expired` bersifat final.

### 9.6 Kode error dari fungsi database dan pesan untuk pengguna

| Kode (`message` awalan) | Pesan UI (Indonesia) |
|---|---|
| `EMPTY_CART` | Keranjang kosong. |
| `INVALID_ITEM` | Ada item yang tidak valid. Muat ulang keranjang Anda. |
| `VARIANT_UNAVAILABLE` | Salah satu produk sudah tidak tersedia. |
| `INSUFFICIENT_STOCK` | Stok salah satu produk tidak mencukupi. Kurangi jumlah atau pilih varian lain. |
| `INVALID_ADDRESS` | Alamat pengiriman belum lengkap. |
| `SHIPPING_UNAVAILABLE` | Pengiriman ke wilayah ini belum tersedia. Hubungi kami. |
| `FORBIDDEN` | Anda tidak memiliki akses. |
| `ORDER_NOT_FOUND` | Pesanan tidak ditemukan. |
| `INVALID_TRANSITION` | Status pesanan tidak dapat diubah seperti itu. |
| SQLSTATE `23505` pada `idempotency_key` | Server Action mencoba memanggil ulang sekali; jika masih gagal tampilkan "Coba lagi". |

Server Action memetakan `error.message` (awalan sebelum tanda `:`) ke pesan di atas. Pesan teknis tidak pernah ditampilkan ke pengguna.

---

## 10. Arsitektur dan Konvensi Kode

### 10.1 Stack dan whitelist dependensi

| Komponen | Teknologi |
|---|---|
| Framework | Next.js App Router, React, TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Validasi | Zod |
| Form | React Hook Form + `@hookform/resolvers` |
| State keranjang | Zustand (`persist`) |
| Backend | Supabase: PostgreSQL, Auth, Storage, RLS; `@supabase/supabase-js`, `@supabase/ssr` |
| Pengujian | Vitest, Playwright |
| Hosting | Vercel (atau kompatibel) |

**Whitelist paket npm** (selain yang dibawa scaffold):

- Runtime: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `server-only`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `sonner`.
- Dev: `tailwindcss`, `@tailwindcss/postcss`, `postcss` (jika belum ada), `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`, `@axe-core/playwright`, `supabase` (CLI), `dotenv`.
- komponen shadcn/ui ditambahkan lewat CLI-nya dan boleh membawa dependensi Radix yang dibutuhkannya.
- Dilarang tanpa keputusan baru di §4: library tanggal (gunakan `Intl`), library state tambahan, ORM (Prisma/Drizzle), library UI lain, library HTTP (gunakan `fetch`).

### 10.2 Struktur folder (tanpa `src/`)

```text
hairy/
├── app/
│   ├── (store)/                      # layout toko: header + footer
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # /
│   │   ├── products/page.tsx
│   │   ├── products/[slug]/page.tsx
│   │   ├── categories/[slug]/page.tsx
│   │   ├── sale/page.tsx
│   │   ├── search/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── orders/[orderNumber]/page.tsx
│   │   ├── about/page.tsx
│   │   ├── size-guide/page.tsx
│   │   ├── care-guide/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── privacy-policy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── shipping-policy/page.tsx
│   │   └── returns-policy/page.tsx
│   ├── (auth)/{login,register,forgot-password,reset-password}/page.tsx
│   ├── auth/callback/route.ts
│   ├── account/{page.tsx,profile/,addresses/,orders/}
│   ├── admin/
│   │   ├── layout.tsx                # guard requireStaff()
│   │   ├── page.tsx
│   │   ├── categories/ products/ inventory/ orders/ customers/ settings/
│   ├── layout.tsx  globals.css  not-found.tsx  error.tsx  sitemap.ts  robots.ts
├── components/
│   ├── ui/            # shadcn
│   ├── layout/ home/ product/ category/ cart/ checkout/ order/ account/ admin/
├── lib/
│   ├── env.ts
│   ├── supabase/{client.ts,server.ts,public.ts,admin.ts,proxy.ts}
│   ├── auth/guards.ts
│   ├── validations/                  # skema Zod per domain
│   ├── pricing/                      # calculateTotals (fungsi murni)
│   ├── utils/{cn.ts,format.ts,slug.ts,phone.ts}
│   └── errors.ts                     # pemetaan kode error → pesan
├── services/                         # akses data, server-only
│   ├── catalog.service.ts  shipping.service.ts  orders.service.ts
│   ├── orders.public.service.ts  inventory.service.ts  admin/*.ts
├── actions/                          # Server Actions
│   ├── auth.actions.ts  account.actions.ts  checkout.actions.ts
│   ├── payment.actions.ts  admin-catalog.actions.ts  admin-orders.actions.ts  admin-settings.actions.ts
├── stores/cart.store.ts
├── config/{site.ts,regions.ts,order-status.ts}
├── types/{database.types.ts,action.ts,domain.ts}
├── supabase/{config.toml,migrations/,dev/sample_products.sql}
├── tests/{unit/,e2e/,security/}
├── docs/PROJECT_PLAN.md
├── proxy.ts                          # sejajar dengan app/
├── .env.example                      # .env.local TIDAK dikomit
└── AGENTS.md  CLAUDE.md  README.md  package.json  tsconfig.json  next.config.ts
```

Folder dan file dibuat **saat dibutuhkan task**, bukan sekaligus sebagai file kosong. Folder `lib/mock/` boleh ada sementara pada Fase 1 dan harus dihapus di P4-04.

### 10.3 Konvensi kode dan batas modul

- TypeScript strict; tanpa `any` kecuali dengan komentar alasan. Tipe database dibuat dari `supabase gen types` (P2-11), tidak ditulis manual.
- Nama file `kebab-case.tsx`; komponen `PascalCase`; fungsi dan variabel `camelCase`; tabel dan kolom SQL `snake_case`.
- Server Components secara default. `'use client'` hanya pada komponen daun yang butuh state/efek browser.
- `services/*` dan `lib/supabase/{server,admin}.ts` diawali `import 'server-only'`. Komponen klien tidak boleh mengimpornya.
- Komponen UI tidak memanggil Supabase langsung; data dari service via Server Component atau dari Server Action.
- Semua mutasi lewat Server Action dengan urutan: **otorisasi → validasi Zod → service/RPC → `revalidatePath` bila perlu → `ActionResult`**.
- Env dibaca hanya lewat `lib/env.ts` (divalidasi Zod). Variabel server tidak dibaca dari kode klien.
- Uang: selalu integer rupiah; format hanya di lapisan tampilan (`formatRupiah`). Tidak ada perhitungan dengan float.
- Waktu: simpan UTC; tampilkan dengan `timeZone: 'Asia/Jakarta'`.
- Teks UI dalam bahasa Indonesia; pesan error ramah pengguna; detail teknis hanya di log server tanpa data pribadi atau secret.
- Gambar lewat `next/image` dengan `sizes` yang benar; wajib `alt`.
- `params` dan `searchParams` di-`await` (Next.js ≥ 15).
- Impor memakai alias `@/`.
- Komentar menjelaskan *mengapa*, bukan *apa*. Tidak ada kode mati.

### 10.4 Pola Server Action dan hasil standar

`types/action.ts`:

```ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false
      error: { code: string; message: string; fieldErrors?: Record<string, string[]> }
    }
```

Kerangka action (urutan wajib):

```ts
'use server'
import { requireAdmin } from '@/lib/auth/guards'
import { categorySchema } from '@/lib/validations/category'
import type { ActionResult } from '@/types/action'

export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin()                                  // 1. otorisasi
  const parsed = categorySchema.safeParse(input)        // 2. validasi
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION', message: 'Data tidak valid.',
      fieldErrors: /* flatten sesuai versi Zod terpasang */ {} } }
  }
  // 3. panggil service (klien sesi + RLS); 4. revalidatePath; 5. return { ok: true, data }
}
```

### 10.5 Modul Supabase dan daftar izin admin client

| File | Fungsi | Catatan |
|---|---|---|
| `lib/supabase/client.ts` | `createBrowserClient` dengan URL + publishable key | Hanya untuk Client Component (mis. auth) |
| `lib/supabase/server.ts` | `createServerClient` dengan cookie (`await cookies()`) | Klien utama server; RLS berlaku |
| `lib/supabase/public.ts` | Klien tanpa cookie (publishable key) | Baca katalog publik agar bisa di-cache |
| `lib/supabase/proxy.ts` | `updateSession(request)` | Dipanggil dari `proxy.ts` |
| `lib/supabase/admin.ts` | `createClient` dengan `SUPABASE_SECRET_KEY`; `import 'server-only'`; `persistSession: false` | **Melewati RLS. Dibatasi.** |

**Admin client hanya boleh diimpor oleh:**

1. `actions/checkout.actions.ts` — memanggil `create_order`.
2. `actions/payment.actions.ts` — mengunggah bukti dan memanggil `submit_payment_proof`.
3. `services/orders.public.service.ts` — membaca pesanan untuk tamu/pemilik **setelah** memverifikasi token atau kepemilikan di kode.
4. `tests/**` dan skrip pengujian.

Pelanggaran daftar ini adalah bug keamanan. P10-05 memindai impor `lib/supabase/admin` di luar daftar.

### 10.6 Guard otorisasi dan `proxy.ts`

`proxy.ts` (di root `hairy/`, sejajar `app/`):

```ts
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
```

`lib/supabase/proxy.ts` (kerangka; cocokkan dengan dokumentasi Supabase untuk versi `@supabase/ssr` terpasang):

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        } } },
  )
  // Jangan menjalankan kode apa pun antara createServerClient dan getClaims().
  const { data } = await supabase.auth.getClaims()
  const path = request.nextUrl.pathname
  if (!data?.claims && (path.startsWith('/account') || path.startsWith('/admin'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }
  return response
}
```

`lib/auth/guards.ts` (`import 'server-only'`):

- `getCurrentUser()` → `getClaims()`; kembalikan `{ id: claims.sub, email }` atau `null`.
- `requireUser()` → jika `null`, `redirect('/login')`.
- `requireStaff()` → `requireUser()` lalu baca `staff_roles` milik sendiri lewat klien sesi; jika tidak ada baris, `notFound()`. Kembalikan `{ user, role }`.
- `requireAdmin()` → `requireStaff()` lalu pastikan `role === 'admin'`, jika tidak `notFound()`.

Redirect proxy hanyalah kenyamanan; **otorisasi sebenarnya** ada di guard dan RLS. `app/admin/layout.tsx` memanggil `requireStaff()`, dan setiap action/service admin memanggil guard-nya sendiri.

### 10.7 Environment variables

`.env.example` (dikomit, tanpa nilai):

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Hanya server. Jangan beri awalan NEXT_PUBLIC_.
SUPABASE_SECRET_KEY=
```

Ketentuan: `.env*` (kecuali `.env.example`) ada di `.gitignore` dan diverifikasi di P0-05. Publishable key boleh di klien karena akses dibatasi RLS. Secret key hanya di server (Vercel menyimpannya sebagai Environment Variable terenkripsi). Dilarang membagikan isi env lewat screenshot, log, atau prompt.

---
## 11. Spesifikasi Database Supabase

SQL pada bagian ini adalah **spesifikasi yang harus disalin ke file migration** (dengan penyesuaian bila ada error nyata saat dijalankan; catat penyesuaian di Handoff Log). Jangan menyingkat atau menghilangkan constraint, grant, atau revoke.

> **Status verifikasi SQL (20 Okt 2026).** Seluruh blok SQL §11.3–11.9 (kecuali `pg_cron`) dijalankan berurutan pada PostgreSQL 16 dengan stub skema `auth`/`storage` dan role `anon`/`authenticated`/`service_role`, tanpa error. Diuji perilakunya: total dan snapshot pesanan, penggabungan baris duplikat, idempotensi, `INSUFFICIENT_STOCK`, rollback penuh bila ada item gagal, `cancel_order` dan `expire_unpaid_orders` (stok kembali tepat sekali), alur `submit_payment_proof` → `verify_payment`, `adjust_stock` (stok negatif ditolak `23514`), seluruh matriks izin §11.10 untuk anon/pelanggan/staf/admin, dua sesi paralel untuk stok terakhir (tepat satu berhasil), dua pesanan dengan urutan varian terbalik (tanpa deadlock), dan kunci idempotensi sama paralel (sesi kedua mendapat `23505`, panggilan ulang mengembalikan `replayed = true`). **Belum diuji:** `pg_cron`, policy `storage.objects` pada Storage Supabase asli, perilaku `auth.uid()` dari JWT nyata, dan empat fungsi pada §11.6 (belum ditulis). P2-12 wajib mengulang verifikasi ini terhadap project Supabase sebenarnya.

### 11.1 Prinsip

- PostgreSQL, primary key `uuid` (`gen_random_uuid()`), waktu `timestamptz`, uang `integer` rupiah (D-04).
- Semua objek di schema `public`, nama `snake_case`.
- **RLS diaktifkan di setiap tabel** dan **GRANT diberikan eksplisit** (§11.7). Tabel tanpa keduanya dianggap cacat.
- Fungsi bisnis berjalan `security definer` dengan `set search_path = public`, dan hak eksekusinya dibatasi (§11.7).
- Stok hanya berubah lewat fungsi; setiap perubahan tercatat di `stock_movements`.
- Data transaksi (pesanan) menyimpan **snapshot**; relasi ke produk memakai `on delete set null`.

### 11.2 Urutan file migration

Buat dengan `npx supabase migration new <nama>` (CLI menambahkan timestamp di nama file). Nomor di tabel adalah urutan logis.

| # | Nama | Isi | Task |
|---|---|---|---|
| 0001 | `foundation` | Ekstensi, enum, fungsi dasar, `store_settings` | P2-02 |
| 0002 | `identity` | `profiles`, `staff_roles`, `is_staff/is_admin`, `addresses` | P2-03 |
| 0003 | `catalog` | `categories`, `products`, `product_variants`, `product_images` | P2-04 |
| 0004 | `commerce` | `shipping_rates`, `orders`, `order_items`, `order_status_history`, `payments`, `shipments`, `stock_movements` | P2-05 |
| 0005 | `functions` | Fungsi bisnis dan trigger | P2-06 |
| 0006 | `rls_and_grants` | RLS, policy, GRANT, REVOKE EXECUTE | P2-07 |
| 0007 | `storage` | Bucket dan policy storage | P2-08 |
| 0008 | `cron_expire_orders` | Jadwal pembersihan pesanan kedaluwarsa | P2-09 |
| 0009 | `reference_data` | 8 kategori, `store_settings`, tarif ongkir default | P2-10 |
| 0010 | `product_listing_view` | View `product_listing` (`security_invoker`) untuk katalog | P4-01 |

### 11.3 Migration 0001 — fondasi

```sql
create extension if not exists pg_trgm with schema extensions;

create type public.staff_role           as enum ('admin', 'staff');
create type public.order_status         as enum ('pending','processing','shipped','completed','cancelled','expired');
create type public.payment_status       as enum ('unpaid','proof_submitted','paid','refunded');
create type public.payment_record_status as enum ('pending','submitted','verified','rejected');
create type public.shipment_status      as enum ('pending','shipped','delivered','returned');
create type public.stock_movement_type  as enum ('initial','restock','adjustment','reserve','release');

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Kode acak tanpa karakter membingungkan (tanpa I, L, O, 0, 1)
create or replace function public.random_code(p_length int) returns text
language plpgsql volatile as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_result text := '';
begin
  for i in 1..p_length loop
    v_result := v_result || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
  end loop;
  return v_result;
end $$;

create table public.store_settings (
  id smallint primary key default 1 check (id = 1),         -- satu baris saja
  store_name text not null default 'Hairy Hijab',
  contact_whatsapp text,
  contact_email text,
  address text,
  logo_path text,
  bank_accounts jsonb not null default '[]'::jsonb,         -- [{bank, account_number, account_name}]
  payment_expiry_hours integer not null default 24 check (payment_expiry_hours between 1 and 168),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);
create trigger trg_store_settings_updated before update on public.store_settings
  for each row execute function public.set_updated_at();
```

> `store_settings` dapat dibaca publik (nama toko, kontak, rekening tujuan transfer). **Jangan pernah menyimpan secret di tabel ini.**

### 11.4 Migration 0002–0004 — tabel

**0002 identity**

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role HANYA di sini. Tidak ada policy tulis untuk klien; diisi pemilik lewat SQL.
create table public.staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.staff_role not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_roles where user_id = (select auth.uid()));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_roles
                  where user_id = (select auth.uid()) and role = 'admin');
$$;

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  province text not null,
  city text not null,
  district text not null,
  postal_code text not null,
  address_detail text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_addresses_user on public.addresses(user_id);
create unique index uq_addresses_one_default on public.addresses(user_id) where is_default;
create trigger trg_addresses_updated before update on public.addresses
  for each row execute function public.set_updated_at();

create or replace function public.enforce_single_default_address() returns trigger
language plpgsql as $$
begin
  update public.addresses set is_default = false
   where user_id = new.user_id and id <> new.id and is_default;
  return new;
end $$;
create trigger trg_addresses_default before insert or update of is_default on public.addresses
  for each row when (new.is_default) execute function public.enforce_single_default_address();
```

**0003 catalog**

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  requires_size boolean not null default false,
  size_options text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  material text,
  care_instructions text,
  specs jsonb not null default '{}'::jsonb,                  -- tampilan saja, mis. {"dimensi":"110x110 cm"}
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_category on public.products(category_id);
create index idx_products_active_created on public.products(is_active, created_at desc);
create index idx_products_name_trgm on public.products using gin (name extensions.gin_trgm_ops);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text,
  color_name text,
  color_hex text   check (color_hex   is null or color_hex   ~ '^#[0-9A-Fa-f]{6}$'),
  color_hex_2 text check (color_hex_2 is null or color_hex_2 ~ '^#[0-9A-Fa-f]{6}$'),  -- warna kedua (Two Tone)
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price > price),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_variant_combo unique nulls not distinct (product_id, size, color_name)
);
create index idx_variants_product on public.product_variants(product_id);
create trigger trg_variants_updated before update on public.product_variants
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  storage_path text not null,                                -- path di bucket product-images
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_images_product on public.product_images(product_id, sort_order);
```

**0004 commerce**

```sql
create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  province text not null unique,                             -- '*' = tarif default
  label text not null default 'Tarif flat',
  cost integer not null check (cost >= 0),
  estimated_days text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_shipping_rates_updated before update on public.shipping_rates
  for each row execute function public.set_updated_at();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  public_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  idempotency_key uuid not null unique,
  user_id uuid references auth.users(id) on delete set null,           -- null = tamu
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  subtotal integer not null default 0 check (subtotal >= 0),
  shipping_cost integer not null default 0 check (shipping_cost >= 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  grand_total integer not null default 0 check (grand_total >= 0),
  customer_name_snapshot text not null,
  customer_phone_snapshot text not null,
  customer_email_snapshot text,
  shipping_address_snapshot jsonb not null,
  notes text,
  cancel_reason text,
  expires_at timestamptz not null,
  stock_released_at timestamptz,
  paid_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_order_total check (grand_total = subtotal + shipping_cost - discount_amount)
);
create index idx_orders_user on public.orders(user_id, created_at desc);
create index idx_orders_status on public.orders(status, created_at desc);
create index idx_orders_expiry on public.orders(expires_at)
  where status = 'pending' and payment_status = 'unpaid';
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  size_snapshot text,
  color_snapshot text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 20),
  line_total integer not null,
  constraint chk_line_total check (line_total = unit_price * quantity)
);
create index idx_order_items_order on public.order_items(order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  from_payment_status public.payment_status,
  to_payment_status public.payment_status not null,
  actor_id uuid,                                              -- null = sistem/tamu
  created_at timestamptz not null default now()
);
create index idx_order_history_order on public.order_status_history(order_id, created_at);

-- Satu baris = satu percobaan pembayaran (riwayat). Netral terhadap provider (D-10).
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null default 'bank_transfer',
  provider text,
  provider_reference text,
  amount integer not null check (amount >= 0),
  status public.payment_record_status not null default 'pending',
  proof_path text,                                            -- path di bucket payment-proofs
  bank_name text,
  sender_name text,
  customer_note text,
  review_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payments_order on public.payments(order_id);
create unique index uq_payments_provider_ref on public.payments(provider, provider_reference)
  where provider is not null;                                  -- idempotensi webhook kelak
create trigger trg_payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  courier text not null,
  service text,
  tracking_number text,
  status public.shipment_status not null default 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_shipments_updated before update on public.shipments
  for each row execute function public.set_updated_at();

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  movement_type public.stock_movement_type not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  stock_after integer not null check (stock_after >= 0),
  order_id uuid references public.orders(id) on delete set null,
  reason text,
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index idx_stock_movements_variant on public.stock_movements(variant_id, created_at desc);
```

### 11.5 Migration 0005 — fungsi bisnis

**Trigger riwayat pesanan dan stok awal**

```sql
create or replace function public.log_order_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, to_status, to_payment_status, actor_id)
    values (new.id, new.status, new.payment_status, (select auth.uid()));
  elsif new.status is distinct from old.status
     or new.payment_status is distinct from old.payment_status then
    insert into public.order_status_history
      (order_id, from_status, to_status, from_payment_status, to_payment_status, actor_id)
    values (new.id, old.status, new.status, old.payment_status, new.payment_status, (select auth.uid()));
  end if;
  return new;
end $$;
create trigger trg_orders_history after insert or update on public.orders
  for each row execute function public.log_order_change();

create or replace function public.log_initial_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.stock_quantity > 0 then
    insert into public.stock_movements (variant_id, movement_type, quantity_delta, stock_after, reason, actor_id)
    values (new.id, 'initial', new.stock_quantity, new.stock_quantity, 'Stok awal', (select auth.uid()));
  end if;
  return new;
end $$;
create trigger trg_variants_initial_stock after insert on public.product_variants
  for each row execute function public.log_initial_stock();
```

**`create_order`** — dipanggil **hanya** oleh server dengan admin client (service role).

```sql
create or replace function public.create_order(
  p_idempotency_key uuid,
  p_user_id uuid,                 -- diisi server dari sesi; null untuk tamu
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_address jsonb,       -- {recipient_name, phone, province, city, district, postal_code, address_detail}
  p_items jsonb,                  -- [{"variant_id":"<uuid>","quantity":2}, ...]
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_expiry_hours integer;
  v_province text;
  v_shipping integer;
  v_subtotal integer := 0;
  v_item record;
  v_variant record;
begin
  -- 1. Idempotensi: kunci yang sama → pesanan yang sama
  select * into v_order from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('order_id', v_order.id, 'order_number', v_order.order_number,
                              'public_token', v_order.public_token, 'replayed', true);
  end if;

  -- 2. Validasi bentuk input
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'INVALID_ITEM';
  end if;

  v_province := nullif(trim(p_shipping_address->>'province'), '');
  if v_province is null
     or nullif(trim(p_shipping_address->>'recipient_name'), '') is null
     or nullif(trim(p_shipping_address->>'phone'), '') is null
     or nullif(trim(p_shipping_address->>'city'), '') is null
     or nullif(trim(p_shipping_address->>'address_detail'), '') is null then
    raise exception 'INVALID_ADDRESS';
  end if;

  -- 3. Ongkir: provinsi yang cocok lebih dulu, lalu baris default '*'
  select cost into v_shipping
    from public.shipping_rates
   where is_active and (lower(province) = lower(v_province) or province = '*')
   order by (province = '*') asc
   limit 1;
  if v_shipping is null then
    raise exception 'SHIPPING_UNAVAILABLE';
  end if;

  select payment_expiry_hours into v_expiry_hours from public.store_settings where id = 1;
  v_expiry_hours := coalesce(v_expiry_hours, 24);

  -- 4. Nomor pesanan HH-YYMMDD-XXXXX (waktu Jakarta)
  loop
    v_order_number := 'HH-' || to_char(timezone('Asia/Jakarta', now()), 'YYMMDD') || '-' || public.random_code(5);
    exit when not exists (select 1 from public.orders where order_number = v_order_number);
  end loop;

  insert into public.orders (order_number, idempotency_key, user_id, customer_name_snapshot,
      customer_phone_snapshot, customer_email_snapshot, shipping_address_snapshot, notes, expires_at)
  values (v_order_number, p_idempotency_key, p_user_id, p_customer_name, p_customer_phone,
      nullif(p_customer_email, ''), p_shipping_address, p_notes,
      now() + make_interval(hours => v_expiry_hours))
  returning id into v_order_id;

  -- 5. Gabungkan baris duplikat; kunci varian berurutan (cegah deadlock)
  for v_item in
    select (e->>'variant_id')::uuid as variant_id, sum((e->>'quantity')::int) as quantity
      from jsonb_array_elements(p_items) e
     group by 1
     order by 1
  loop
    if v_item.quantity < 1 or v_item.quantity > 20 then
      raise exception 'INVALID_ITEM';
    end if;

    select v.id, v.sku, v.size, v.color_name, v.price, v.stock_quantity,
           v.is_active as v_active, p.name as product_name,
           p.is_active as p_active, c.is_active as c_active
      into v_variant
      from public.product_variants v
      join public.products p   on p.id = v.product_id
      join public.categories c on c.id = p.category_id
     where v.id = v_item.variant_id
       for update of v;

    if not found or not v_variant.v_active or not v_variant.p_active or not v_variant.c_active then
      raise exception 'VARIANT_UNAVAILABLE:%', v_item.variant_id;
    end if;
    if v_variant.stock_quantity < v_item.quantity then
      raise exception 'INSUFFICIENT_STOCK:%', v_item.variant_id;
    end if;

    update public.product_variants
       set stock_quantity = stock_quantity - v_item.quantity
     where id = v_item.variant_id;

    insert into public.stock_movements
      (variant_id, movement_type, quantity_delta, stock_after, order_id, reason)
    values (v_item.variant_id, 'reserve', -v_item.quantity,
            v_variant.stock_quantity - v_item.quantity, v_order_id, 'Reservasi checkout');

    insert into public.order_items
      (order_id, variant_id, product_name_snapshot, sku_snapshot, size_snapshot,
       color_snapshot, unit_price, quantity, line_total)
    values (v_order_id, v_item.variant_id, v_variant.product_name, v_variant.sku, v_variant.size,
            v_variant.color_name, v_variant.price, v_item.quantity, v_variant.price * v_item.quantity);

    v_subtotal := v_subtotal + v_variant.price * v_item.quantity;
  end loop;

  update public.orders
     set subtotal = v_subtotal, shipping_cost = v_shipping, grand_total = v_subtotal + v_shipping
   where id = v_order_id;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number,
    'public_token', (select public_token from public.orders where id = v_order_id),
    'replayed', false);
end $$;
```

Catatan untuk Server Action: jika fungsi mengembalikan error SQLSTATE `23505` (dua permintaan dengan kunci sama berlomba), panggil ulang **sekali**; panggilan kedua akan menemukan pesanan yang sudah ada.

**Pelepasan stok, pembatalan, kedaluwarsa**

```sql
create or replace function public.release_order_stock(p_order_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_item record;
  v_new_stock integer;
begin
  if exists (select 1 from public.orders where id = p_order_id and stock_released_at is not null) then
    return;                                                    -- sudah pernah dilepas
  end if;
  for v_item in
    select variant_id, quantity from public.order_items
     where order_id = p_order_id and variant_id is not null
     order by variant_id
  loop
    update public.product_variants set stock_quantity = stock_quantity + v_item.quantity
     where id = v_item.variant_id returning stock_quantity into v_new_stock;
    if found then
      insert into public.stock_movements
        (variant_id, movement_type, quantity_delta, stock_after, order_id, reason, actor_id)
      values (v_item.variant_id, 'release', v_item.quantity, v_new_stock, p_order_id, p_reason, (select auth.uid()));
    end if;
  end loop;
  update public.orders set stock_released_at = now() where id = p_order_id;
end $$;

create or replace function public.cancel_order(p_order_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status not in ('pending','processing') then raise exception 'INVALID_TRANSITION'; end if;
  perform public.release_order_stock(p_order_id, coalesce(nullif(trim(p_reason), ''), 'Pesanan dibatalkan'));
  update public.orders set status = 'cancelled', cancel_reason = nullif(trim(p_reason), '')
   where id = p_order_id;
end $$;

create or replace function public.expire_unpaid_orders() returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_order record;
  v_count integer := 0;
begin
  for v_order in
    select id from public.orders
     where status = 'pending' and payment_status = 'unpaid' and expires_at < now()
     order by expires_at
       for update skip locked
  loop
    perform public.release_order_stock(v_order.id, 'Pesanan kedaluwarsa');
    update public.orders set status = 'expired' where id = v_order.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;
```

**Pembayaran**

```sql
-- Dipanggil server (service role) setelah file bukti berhasil diunggah.
create or replace function public.submit_payment_proof(
  p_order_id uuid, p_proof_path text, p_bank_name text, p_sender_name text, p_note text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'pending' or v_order.payment_status <> 'unpaid' or v_order.expires_at < now() then
    raise exception 'INVALID_TRANSITION';
  end if;
  insert into public.payments (order_id, amount, status, proof_path, bank_name, sender_name, customer_note, submitted_at)
  values (p_order_id, v_order.grand_total, 'submitted', p_proof_path,
          nullif(trim(p_bank_name), ''), nullif(trim(p_sender_name), ''), nullif(trim(p_note), ''), now());
  update public.orders set payment_status = 'proof_submitted' where id = p_order_id;
end $$;

create or replace function public.verify_payment(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'pending' or v_order.payment_status <> 'proof_submitted' then
    raise exception 'INVALID_TRANSITION';
  end if;
  update public.payments
     set status = 'verified', reviewed_at = now(), reviewed_by = (select auth.uid())
   where id = (select id from public.payments
                where order_id = p_order_id and status = 'submitted'
                order by submitted_at desc limit 1);
  update public.orders set payment_status = 'paid', status = 'processing', paid_at = now()
   where id = p_order_id;
end $$;

create or replace function public.adjust_stock(p_variant_id uuid, p_delta integer, p_reason text)
returns integer
language plpgsql security definer set search_path = public as $$
declare v_new integer;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if p_delta = 0 or nullif(trim(p_reason), '') is null then raise exception 'INVALID_ITEM'; end if;
  update public.product_variants set stock_quantity = stock_quantity + p_delta
   where id = p_variant_id returning stock_quantity into v_new;      -- stok negatif ditolak CHECK (23514)
  if not found then raise exception 'VARIANT_UNAVAILABLE'; end if;
  insert into public.stock_movements (variant_id, movement_type, quantity_delta, stock_after, reason, actor_id)
  values (p_variant_id, case when p_delta > 0 then 'restock' else 'adjustment' end::public.stock_movement_type,
          p_delta, v_new, trim(p_reason), (select auth.uid()));
  return v_new;
end $$;
```

Server Action memetakan SQLSTATE `23514` dari `adjust_stock` ke `INSUFFICIENT_STOCK`.

### 11.6 Kontrak fungsi admin lainnya (ditulis agent mengikuti pola §11.5)

Semua: `security definer`, `set search_path = public`, baris pertama `if not public.is_staff() then raise exception 'FORBIDDEN'; end if;`, kunci pesanan dengan `for update`, tolak transisi di luar §9.5 dengan `INVALID_TRANSITION`.

| Fungsi | Syarat | Efek |
|---|---|---|
| `reject_payment(p_order_id uuid, p_note text)` | `pending` + `proof_submitted`; catatan wajib | Pembayaran `submitted` terbaru → `rejected` (`review_note`, `reviewed_by/at`); `payment_status` → `unpaid`; `expires_at` = sekarang + `payment_expiry_hours` |
| `mark_order_shipped(p_order_id uuid, p_courier text, p_service text, p_tracking_number text)` | `processing`; kurir wajib | Upsert `shipments` (`status='shipped'`, `shipped_at=now()`); `orders.status='shipped'`, `shipped_at=now()` |
| `complete_order(p_order_id uuid)` | `shipped` | `status='completed'`; `shipments.status='delivered'`, `delivered_at=now()` |
| `mark_refunded(p_order_id uuid, p_note text)` | `cancelled` + `paid` | `payment_status='refunded'`; catatan disimpan di `payments.review_note` pembayaran `verified` terbaru |

### 11.7 Migration 0006 — RLS dan GRANT

**Prinsip.** Default Supabase tidak lagi memberi akses ke tabel baru; semua akses di bawah ini eksplisit. RLS membatasi baris, `GRANT` membatasi operasi dan kolom. Keduanya wajib.

**Matriks akses** (`—` = tidak ada akses; `R` = SELECT; `W` = INSERT/UPDATE/DELETE dibatasi policy):

| Tabel | `anon` | `authenticated` | Aturan baris (RLS) |
|---|---|---|---|
| `store_settings` | R | R; admin: update | Baca semua; update hanya `is_admin()` |
| `categories` | R | R; admin: W | Publik hanya `is_active`; staf melihat semua; tulis `is_admin()` |
| `products` | R | R; admin: W | Publik hanya `is_active` dan kategori aktif; staf semua; tulis `is_admin()` |
| `product_variants` | R | R; admin: insert/update/delete | Publik hanya `is_active` dengan produk dan kategori aktif; **kolom `stock_quantity` tidak dapat di-update klien** |
| `product_images` | R | R; admin: W | Publik jika produk aktif |
| `shipping_rates` | R | R; admin: W | Publik hanya `is_active` |
| `profiles` | — | R sendiri (admin: semua); update `full_name`, `phone` milik sendiri | `id = auth.uid()` |
| `addresses` | — | W milik sendiri | `user_id = auth.uid()` |
| `staff_roles` | — | R baris sendiri | Tanpa tulis dari klien |
| `orders` | — | R milik sendiri atau staf | Tanpa tulis dari klien |
| `order_items`, `order_status_history`, `payments`, `shipments` | — | R lewat pesanan milik sendiri atau staf | Tanpa tulis dari klien |
| `stock_movements` | — | R staf | Tanpa tulis dari klien |
| semua tabel | — | — | `service_role`: akses penuh (bypass RLS) |

```sql
-- Aktifkan RLS di SEMUA tabel
alter table public.store_settings       enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_variants     enable row level security;
alter table public.product_images       enable row level security;
alter table public.shipping_rates       enable row level security;
alter table public.profiles             enable row level security;
alter table public.addresses            enable row level security;
alter table public.staff_roles          enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments             enable row level security;
alter table public.shipments            enable row level security;
alter table public.stock_movements      enable row level security;

-- ===== GRANT eksplisit =====
grant usage on schema public to anon, authenticated, service_role;

grant select on public.categories, public.products, public.product_variants, public.product_images,
                public.shipping_rates, public.store_settings to anon, authenticated;

grant insert, update, delete on public.categories, public.products, public.product_images,
                                public.shipping_rates to authenticated;                 -- dibatasi RLS is_admin()
grant insert, delete on public.product_variants to authenticated;
grant update (sku, size, color_name, color_hex, color_hex_2, price, compare_at_price, is_active)
  on public.product_variants to authenticated;                                          -- TANPA stock_quantity
grant update on public.store_settings to authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select on public.staff_roles, public.orders, public.order_items, public.order_status_history,
                public.payments, public.shipments, public.stock_movements to authenticated;

grant all on all tables in schema public to service_role;

-- ===== Policy =====
-- Katalog publik
create policy categories_read on public.categories for select to anon, authenticated
  using (is_active or public.is_staff());
create policy categories_write on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy products_read on public.products for select to anon, authenticated
  using (public.is_staff() or (is_active and exists (
    select 1 from public.categories c where c.id = products.category_id and c.is_active)));
create policy products_write on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy variants_read on public.product_variants for select to anon, authenticated
  using (public.is_staff() or (is_active and exists (
    select 1 from public.products p join public.categories c on c.id = p.category_id
     where p.id = product_variants.product_id and p.is_active and c.is_active)));
create policy variants_write on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy images_read on public.product_images for select to anon, authenticated
  using (public.is_staff() or exists (
    select 1 from public.products p join public.categories c on c.id = p.category_id
     where p.id = product_images.product_id and p.is_active and c.is_active));
create policy images_write on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy shipping_rates_read on public.shipping_rates for select to anon, authenticated
  using (is_active or public.is_staff());
create policy shipping_rates_write on public.shipping_rates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy store_settings_read on public.store_settings for select to anon, authenticated using (true);
create policy store_settings_update on public.store_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Identitas
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy addresses_own on public.addresses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy staff_roles_read_own on public.staff_roles for select to authenticated
  using (user_id = (select auth.uid()));

-- Transaksi (baca saja)
create policy orders_read on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy order_items_read on public.order_items for select to authenticated
  using (public.is_staff() or exists (select 1 from public.orders o
         where o.id = order_items.order_id and o.user_id = (select auth.uid())));
create policy order_history_read on public.order_status_history for select to authenticated
  using (public.is_staff() or exists (select 1 from public.orders o
         where o.id = order_status_history.order_id and o.user_id = (select auth.uid())));
create policy payments_read on public.payments for select to authenticated
  using (public.is_staff() or exists (select 1 from public.orders o
         where o.id = payments.order_id and o.user_id = (select auth.uid())));
create policy shipments_read on public.shipments for select to authenticated
  using (public.is_staff() or exists (select 1 from public.orders o
         where o.id = shipments.order_id and o.user_id = (select auth.uid())));
create policy stock_movements_read on public.stock_movements for select to authenticated
  using (public.is_staff());

-- ===== Hak eksekusi fungsi =====
-- PUBLIC mendapat EXECUTE secara bawaan PostgreSQL; hanya bentuk tanpa "in schema" yang bisa mencabutnya.
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_staff(), public.is_admin() to anon, authenticated, service_role;

grant execute on function
  public.cancel_order(uuid, text),
  public.verify_payment(uuid),
  public.adjust_stock(uuid, integer, text)
  to authenticated;                    -- + reject_payment, mark_order_shipped, complete_order, mark_refunded

grant execute on function
  public.create_order(uuid, uuid, text, text, text, jsonb, jsonb, text),
  public.submit_payment_proof(uuid, text, text, text, text),
  public.expire_unpaid_orders()
  to service_role;                     -- create_order TIDAK boleh dipanggil dari browser
```

> Fungsi internal `release_order_stock` dan `random_code` tidak diberi grant ke siapa pun. Setiap migration yang menambah tabel atau fungsi **wajib** menyertakan `GRANT`/`REVOKE`-nya sendiri.

### 11.8 Migration 0007 — Storage

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true,  2097152, array['image/jpeg','image/png','image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy product_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- Bukti transfer: hanya staf yang boleh membaca (lewat signed URL berumur pendek).
-- Unggah dilakukan server dengan admin client; tidak ada policy tulis untuk klien.
create policy payment_proofs_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_staff());
```

Konvensi path: `product-images/<product_id>/<uuid>.<ext>`; `payment-proofs/<order_id>/<uuid>.<ext>`. Validasi MIME dan ukuran dilakukan di server **dan** dibatasi bucket.

### 11.9 Migration 0008 dan 0009

```sql
-- 0008: pg_cron (periksa di dashboard Supabase bila ekstensi perlu diaktifkan manual)
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('expire-unpaid-orders', '*/15 * * * *', $$select public.expire_unpaid_orders();$$);
```

```sql
-- 0009: data referensi (idempoten, aman untuk produksi)
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

insert into public.categories (name, slug, requires_size, size_options, sort_order) values
  ('Bergo Non Karet',        'bergo-non-karet',        true,  '{S,M}', 1),
  ('Bergo Karet',            'bergo-karet',            true,  '{S,M}', 2),
  ('Pashmina Kaos Rayon',    'pashmina-kaos-rayon',    false, '{}',    3),
  ('Pashmina Viscose',       'pashmina-viscose',       false, '{}',    4),
  ('Pashmina Bandana',       'pashmina-bandana',       false, '{}',    5),
  ('Bergo Bandana',          'bergo-bandana',          true,  '{S,M}', 6),
  ('Bergo Bandana Two Tone', 'bergo-bandana-two-tone', true,  '{S,M}', 7),
  ('Paris Jadul',            'paris-jadul',            false, '{}',    8)
on conflict (slug) do nothing;

-- TODO(owner): ganti dengan tarif nyata sebelum peluncuran (§19, Q-03).
insert into public.shipping_rates (province, label, cost, estimated_days)
values ('*', 'Tarif flat', 20000, '2–5 hari kerja') on conflict (province) do nothing;
```

**Admin pertama** — dijalankan **pemilik** di SQL Editor Supabase setelah akunnya terdaftar (P3-05):

```sql
insert into public.staff_roles (user_id, role)
select id, 'admin' from auth.users where email = 'EMAIL_PEMILIK_DI_SINI'
on conflict (user_id) do update set role = excluded.role;
```

**Data contoh [DEV ONLY]** disimpan di `supabase/dev/sample_products.sql` (bukan migration; dijalankan manual di project dev; berisi 3–5 produk contoh dengan varian dan stok untuk pengujian). Dilarang dijalankan di produksi.

### 11.10 Matriks pengujian keamanan database (dipakai P2-12 dan P10-02)

| Aktor | Operasi | Hasil yang diharapkan |
|---|---|---|
| anon | `select` produk/varian nonaktif | 0 baris |
| anon | `select` dari `orders`, `profiles`, `payments`, `stock_movements` | Ditolak (`42501`) |
| anon | `insert`/`update`/`delete` di `products` | Ditolak (`42501`) |
| anon | `rpc create_order`, `rpc verify_payment` | Ditolak (`42501`) |
| pelanggan A | `select` pesanan pelanggan B | 0 baris |
| pelanggan A | `insert`/`update` di `staff_roles` | Ditolak |
| pelanggan A | `update` `profiles` milik B | 0 baris terpengaruh |
| pelanggan A | `update product_variants set stock_quantity` | Ditolak (grant kolom) |
| pelanggan A | `rpc verify_payment`, `rpc cancel_order`, `rpc adjust_stock` | `FORBIDDEN` |
| pelanggan A | Baca objek `payment-proofs` | Ditolak |
| staf | `select` semua pesanan; `rpc verify_payment` pada bukti terkirim | Berhasil |
| staf | `update` harga produk / tulis kategori | 0 baris terpengaruh / ditolak |
| admin | CRUD katalog, tarif, pengaturan | Berhasil |
| service role | `create_order` dengan stok 1, dua panggilan serentak | Tepat satu berhasil, satu `INSUFFICIENT_STOCK` |
| service role | `create_order` dengan `idempotency_key` sama dua kali | Satu pesanan, `replayed = true` pada panggilan kedua |
| service role | `audit_tables_without_rls()` | Mengembalikan daftar kosong |
| service role | `expire_unpaid_orders` pada pesanan lewat tempo | Status `expired`, stok kembali, `stock_released_at` terisi, panggilan kedua tidak menggandakan stok |

---
## 12. UI/UX dan Identitas Brand

### 12.1 Arah desain

- Premium, minimalis, editorial; foto produk adalah elemen visual utama.
- Header sederhana dengan logo Hairy Hijab (logo final dari pemilik; sebelum tersedia gunakan teks "Hairy Hijab" bergaya wordmark).
- Grid katalog responsif: 2 kolom di ponsel, 3 di tablet, 4 di desktop. Desain **mobile-first**.
- Harga, varian, dan tombol beli mudah ditemukan; target sentuh minimal 44 px.
- Teks UI Indonesia; format uang `Rp 125.000`; tanggal `20 Okt 2026` (zona Asia/Jakarta).
- Tidak ada mode gelap pada MVP.

### 12.2 Token warna

Usulan awal dari Rancangan 1.0 dipertahankan dengan **aturan pemakaian** (perhitungan kontras terhadap Ivory menunjukkan Gold ≈ 2,4:1 dan Taupe ≈ 3:1, di bawah batas teks 4,5:1; agent wajib memverifikasi dengan alat kontras).

| Token | Hex | Pemakaian yang benar |
|---|---|---|
| `ivory` | `#F7F3EE` | Latar utama |
| `sand` | `#D9C7B4` | Border, pemisah, latar kartu lembut |
| `taupe` | `#A18A78` | Ikon dekoratif, garis; **bukan teks** |
| `gold` | `#B69A62` | Dekorasi, garis aksen; teks hanya **di atas `espresso`** (≈ 4,8:1) |
| `gold-deep` | `#7A6535` | Teks aksen/tautan di atas Ivory (≈ 5:1) |
| `espresso` | `#3B3028` | Teks utama; latar tombol utama dengan teks `ivory` |
| `success` | `#2F6B4F` | Status berhasil |
| `danger` | `#9B2C2C` | Error, Sold Out, hapus |
| `warning` | `#8A5A00` | Peringatan, stok menipis |

Aturan: tombol utama = latar `espresso` + teks `ivory`. Dilarang teks putih di atas `gold`. Status tidak boleh hanya dibedakan lewat warna (sertakan ikon atau teks). Palet dapat disesuaikan setelah logo dan foto final tersedia, dengan memperbarui token di satu tempat (`app/globals.css`).

Pemetaan token shadcn/ui: `--background`=ivory, `--foreground`=espresso, `--primary`=espresso, `--primary-foreground`=ivory, `--secondary`/`--accent`/`--border`=sand, `--ring`=gold-deep, `--destructive`=danger. Token dideklarasikan di `app/globals.css` (Tailwind v4: `@import "tailwindcss";` dan blok `@theme`; sesuaikan dengan versi terpasang).

### 12.3 Tipografi

Dimuat dengan `next/font/google` (`display: 'swap'`), selalu dengan fallback sistem:

- Heading: **Cormorant Garamond** (serif editorial), fallback `Georgia, serif`.
- Isi: **Jost** (sans bersih), fallback `system-ui, sans-serif`.

### 12.4 Komponen

Dibangun sesuai kebutuhan task, bukan sekaligus. File `kebab-case.tsx`, ekspor `PascalCase`.

| Kelompok | Komponen | Task |
|---|---|---|
| Layout | `SiteHeader`, `SiteFooter`, `MainNavigation`, `MobileNavigation`, `AnnouncementBar` | P1-03 |
| Presentasional | `ProductCard`, `ProductGrid`, `CategoryCard`, `PriceDisplay`, `StockBadge`, `EmptyState`, `LoadingState`, `ErrorState`, `HeroBanner` | P1-04, P1-05 |
| Katalog | `SearchBar`, `ProductFilters`, `SortSelector`, `Pagination` | P4-02 |
| Detail produk | `ProductGallery`, `VariantSelector`, `QuantitySelector`, `AddToCartButton` | P4-03, P5-03 |
| Keranjang/checkout | `CartItem`, `CartSummary`, `CartSheet`, `CheckoutForm`, `AddressFields` | P5-03, P6-04 |
| Pesanan | `OrderStatusBadge`, `OrderTimeline`, `PaymentInstructions`, `ProofUploader`, `ExpiryCountdown` | P6-06, P7-01 |
| Admin | `AdminSidebar`, `DataTable`, `ConfirmDialog`, `ImageUploader`, `VariantTable`, `StockAdjustDialog` | P8 |

### 12.5 Perilaku UI wajib

- Setiap halaman data punya `loading.tsx` (skeleton), `EmptyState`, dan penanganan error (`error.tsx`/`ErrorState`).
- Tombol "Tambah ke Keranjang" nonaktif sampai varian dipilih; bila stok 0 tampil "Sold Out" dan tombol nonaktif dengan alasan yang terbaca.
- Harga coret ditampilkan bersama persentase hemat: `Math.round((compare − price) / compare × 100)`, dihitung dari integer.
- Form: label terhubung ke input, pesan error di bawah field dengan `aria-invalid` dan `aria-describedby`, fokus pindah ke error pertama saat submit gagal, tombol submit menampilkan status memproses dan dicegah klik ganda.
- Pesan sukses/gagal operasi memakai toast (`sonner`) **dan** teks yang dapat dibaca pembaca layar.
- Operasi destruktif admin (nonaktifkan, batalkan pesanan) memakai `ConfirmDialog`.

---

## 13. SEO, Performa, dan Aksesibilitas

### 13.1 SEO

- Metadata unik (`generateMetadata`) untuk beranda, kategori, produk, dan halaman informasi; judul dan deskripsi natural, tanpa dijejali kata kunci.
- Slug produk konsisten dan unik; berubah hanya lewat tindakan sengaja admin.
- `app/sitemap.ts` dibangun dari produk dan kategori aktif; `app/robots.ts` melarang `/admin`, `/account`, `/cart`, `/checkout`, `/orders`, `/auth`, `/login`, `/register`, `/forgot-password`, `/reset-password`.
- Halaman yang tidak boleh terindeks juga membawa `robots: { index: false }` (khususnya `/orders/*` karena URL memuat token).
- Canonical: halaman filter/urutan mengacu ke URL tanpa parameter filter; paginasi mengacu ke dirinya sendiri.
- Open Graph image default dari pemilik (`TODO(owner)`); produk memakai foto utamanya.
- Structured data `Product` (JSON-LD) berisi nama, gambar, `offers.price`, `priceCurrency: "IDR"`, dan `availability` yang diturunkan dari **data aktual**; tidak ada rating atau ulasan palsu.
- Produk nonaktif/tidak ada → `notFound()`; tidak ada soft-404.

### 13.2 Performa

- `next/image` dengan `sizes` sesuai layout; gambar di atas lipatan memakai `priority`; domain Storage didaftarkan di `images.remotePatterns` (P2-11).
- Hindari JavaScript klien berlebih; Server Components untuk daftar dan detail.
- Pagination 24 produk; indeks database sesuai pola kueri (§11.4).
- Katalog publik memakai klien `lib/supabase/public.ts` agar dapat di-cache, dengan kebijakan segar ±60 detik (ikuti dokumentasi caching versi Next.js terpasang). Setelah mutasi admin, panggil `revalidatePath`.
- **Data transaksi tidak pernah bergantung pada cache**: harga, stok, dan total dihitung ulang di server saat checkout dan di dalam `create_order`.
- Target uji lab (ponsel, koneksi 4G simulasi): LCP < 2,5 dtk dan CLS < 0,1 pada beranda dan detail produk.

### 13.3 Aksesibilitas (target WCAG 2.2 AA untuk alur utama)

- Semua gambar informatif memiliki `alt`; gambar dekoratif `alt=""`.
- Form berlabel; error tidak hanya berupa warna; tombol dan tautan bernama jelas.
- Seluruh alur belanja dan admin dapat dioperasikan dengan keyboard; indikator fokus terlihat.
- Kontras teks ≥ 4,5:1 (lihat §12.2); layout terbaca pada layar 320 px.
- Dialog dan sheet menjebak fokus dan menutup dengan `Esc` (disediakan komponen shadcn/Radix; jangan ditimpa).

---

## 14. Pembayaran, Pengiriman, dan Notifikasi

### 14.1 Pembayaran

**MVP (D-10): transfer bank manual.**

1. Halaman `/orders/[orderNumber]` menampilkan rekening dari `store_settings.bank_accounts`, nominal tepat `grand_total`, dan batas waktu (`expires_at`).
2. Pelanggan mengunggah bukti (JPG/PNG/WebP, ≤ 4 MB; klien mengecilkan gambar sisi terpanjang ±1600 px sebelum unggah). Server Action memvalidasi tipe (cek MIME **dan** signature file), ukuran, dan akses (pemilik atau token), mengunggah ke bucket privat, lalu memanggil `submit_payment_proof`.
3. Staf membuka bukti lewat signed URL (60 detik), lalu memanggil `verify_payment` atau `reject_payment`.
4. Jika `store_settings.bank_accounts` kosong, `placeOrder` menolak dengan pesan "Metode pembayaran belum tersedia. Hubungi kami." agar tidak ada pesanan tanpa instruksi bayar.
5. Atur `bodySizeLimit` Server Actions sesuai dokumentasi versi terpasang (bawaan 1 MB tidak cukup untuk bukti transfer).

**Tahap 2: payment gateway** (hanya setelah akun merchant siap dan keputusan D-10 diubah):

1. Server membuat transaksi dari total hasil perhitungan server.
2. Referensi provider disimpan di `payments` (`provider`, `provider_reference`).
3. Provider memanggil webhook (`app/api/webhooks/payments/route.ts`, dibuat saat itu, bukan sekarang).
4. Server memverifikasi keaslian callback sesuai dokumentasi provider.
5. Status diperbarui **idempoten** (indeks unik `provider, provider_reference` sudah tersedia).
6. Pesanan diproses sesuai status pembayaran.

### 14.2 Pengiriman

- MVP: tarif flat dari `shipping_rates` (D-11), dihitung di server dalam `create_order`. UI menyebutnya "Tarif flat" dan tidak menjanjikan estimasi real-time.
- Kurir, layanan, dan nomor resi diisi staf lewat `mark_order_shipped`; pelanggan melihatnya di halaman pesanan.
- Layanan pengiriman otomatis nanti ditambahkan di balik antarmuka (`services/shipping.service.ts`), tanpa mengubah `create_order` selain sumber tarif:

```ts
export interface ShippingProvider {
  quote(input: { province: string; city: string; district?: string; weightGrams?: number }):
    Promise<{ cost: number; label: string; estimatedDays?: string }[]>
}
```

### 14.3 Notifikasi

- MVP tidak mengirim email/WhatsApp otomatis. Email Supabase Auth (verifikasi, reset kata sandi) memakai SMTP sendiri sebelum peluncuran (P11-03).
- Tombol **"Hubungi via WhatsApp"** membuka `https://wa.me/<nomor>?text=<pesan>`; nomor berasal dari `store_settings.contact_whatsapp`, dinormalisasi `lib/utils/phone.ts` (awalan `0` → `62`, hapus karakter non-digit; valid bila diawali `628` dan 10–14 digit). Pesan awal contoh: `Halo Hairy Hijab, saya ingin konfirmasi pesanan HH-261020-AB3CD.`
- Notifikasi otomatis (tahap 2) dikirim dari proses backend dan tidak pernah menjadi sumber kebenaran status pesanan.

---
## 15. Rencana Eksekusi: Fase dan Task

Cara membaca: `S/M/L` ukuran task; **butuh** = task yang harus selesai lebih dulu; checkbox `[ ]` dicentang agent saat selesai. Task **L** dikerjakan per sub-langkah (a, b, c, …) dan setiap sub-langkah dicentang sendiri agar pekerjaan dapat dilanjutkan model lain. Estimasi hari pada Rancangan 1.0 tidak dipakai; urutan dan dependensi inilah acuannya.

**Akhir setiap fase:** jalankan G2 (plus G3/G4 bila disebut), perbarui §1, tulis Handoff Log, dan beri tag `v0.<fase>.0` jika memungkinkan.

**Fase yang dapat berjalan paralel:** Fase 1 (UI) dan Fase 2 (database) tidak saling bergantung. Fase 3 dan seterusnya menunggu Fase 2.

---

### Fase 0 — Audit dan Fondasi Repo

- [x] **P0-01 · Audit lingkungan** `S` · butuh: —
  - **Kerjakan:** Baca `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `AGENTS.md`, struktur folder. Jalankan `node -v`, `npm -v`, `git rev-parse --show-toplevel`, `git branch --show-current`. Periksa apakah `postcss.config.mjs`/Tailwind ada. Isi **tabel §3.1** (kolom "Nilai terverifikasi").
  - **Selesai jika:** Tabel §3.1 terisi dari fakta, bukan asumsi. Node ≥ 20.9. Setiap selisih dengan dokumen ini (mis. Next.js < 16, tidak ada Tailwind, repo Git berada di folder lain) dicatat di Handoff Log dan, bila mengubah keputusan, di §4.

- [x] **P0-02 · Bersihkan scaffold** `S` · butuh: P0-01
  - **Kerjakan:** Ganti isi `app/page.tsx` dengan placeholder minimal; hapus aset contoh bawaan template di `public/` yang tidak dipakai; atur `app/layout.tsx` (`<html lang="id">`, metadata dasar "Hairy Hijab"). Jangan menghapus `AGENTS.md` atau `README.md`.
  - **Selesai jika:** `npm run build` lulus; `/` menampilkan placeholder; tidak ada referensi ke aset template yang sudah dihapus.

- [x] **P0-03 · Tailwind CSS** `S` · butuh: P0-01
  - **Kerjakan:** Jika belum terpasang: pasang `tailwindcss @tailwindcss/postcss postcss`, buat `postcss.config.mjs` dengan plugin `@tailwindcss/postcss`, tambahkan `@import "tailwindcss";` di `app/globals.css` (ikuti dokumentasi Tailwind untuk Next.js dan versi terpasang). Jika sudah ada: catat versi dan lewati.
  - **Selesai jika:** Kelas utilitas terbukti bekerja pada placeholder (lalu dihapus); build lulus.

- [x] **P0-04 · Dependensi inti** `S` · butuh: P0-03
  - **Kerjakan:** `npm install @supabase/supabase-js @supabase/ssr zod zustand react-hook-form @hookform/resolvers server-only clsx tailwind-merge class-variance-authority lucide-react sonner` dan `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test @axe-core/playwright supabase dotenv`.
  - **Selesai jika:** Lockfile diperbarui; build lulus; tidak ada paket di luar whitelist §10.1; hasil `npm audit` (ringkas) dicatat.

- [x] **P0-05 · Struktur dasar, env, utilitas** `M` · butuh: P0-04
  - **Kerjakan:**
    - [x] a. Pastikan alias `@/*` → `./*` di `tsconfig.json`.
    - [x] b. Buat `.env.example` (§10.7); `.gitignore` mengabaikan `.env*` kecuali `.env.example`.
    - [x] c. `lib/env.ts` (Zod; variabel publik divalidasi eksplisit, variabel server divalidasi saat diakses di server).
    - [x] d. `lib/utils/cn.ts`, `format.ts` (`formatRupiah`, `formatDateID` zona Asia/Jakarta), `slug.ts` (`slugify`: huruf kecil, hapus diakritik, non-alfanumerik → `-`), `phone.ts` (`normalizePhoneID`, `buildWhatsAppLink`; aturan §14.3).
    - [x] e. `types/action.ts` (§10.4); `config/site.ts`; `config/regions.ts` (daftar provinsi Indonesia terkini sesuai sumber resmi; catat sumbernya); `config/order-status.ts` (label Indonesia §9.3–9.4).
  - **Selesai jika:** `npx tsc --noEmit` lulus; `git check-ignore .env.local` mencetak path; tidak ada secret di file yang dikomit.

- [x] **P0-06 · AGENTS.md, CLAUDE.md, lokasi plan** `S` · butuh: P0-01
  - **Kerjakan:** Tambahkan blok Lampiran A di **bawah** isi `AGENTS.md` bawaan (jangan menghapusnya). Buat `CLAUDE.md` berisi satu baris `@AGENTS.md`. Pindahkan dokumen ini ke `docs/PROJECT_PLAN.md` di dalam repo Git (`git mv` bila sudah terlacak), hapus salinan lama agar hanya ada satu versi, dan perbarui path di `AGENTS.md`.
  - **Selesai jika:** `AGENTS.md` memuat blok Hairy Hijab dan isi bawaan utuh; `docs/PROJECT_PLAN.md` ada sebagai satu-satunya salinan; commit dibuat.

- [x] **P0-07 · Script dan gate** `S` · butuh: P0-04
  - **Kerjakan:** Tambahkan scripts: `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:rls` (`vitest run --config vitest.rls.config.ts`), `test:e2e` (`playwright test`), `db:types` (`supabase gen types typescript --linked > types/database.types.ts`). Tambahkan `.nvmrc` atau `engines` sesuai Node terverifikasi.
  - **Selesai jika:** `npm run typecheck` dan `npm run lint` lulus; script lain terdaftar (boleh belum berfungsi sampai P0-08/P2).

- [ ] **P0-08 · Vitest dan Playwright** `M` · butuh: P0-05, P0-07
  - **Kerjakan:** `vitest.config.ts` (jsdom, alias `@`, setup jest-dom, `exclude` memuat `tests/security/**` dan `tests/e2e/**`); `vitest.rls.config.ts` (environment node, hanya `tests/security/**`, memuat `.env.local` lewat `dotenv`); `playwright.config.ts` (webServer `npm run dev`, baseURL `http://localhost:3000`, proyek `chromium` dan emulasi ponsel); jalankan `npx playwright install chromium`. Tulis tes unit untuk `formatRupiah` (mis. `125000` → `Rp 125.000`), `slugify`, `normalizePhoneID` (`0812-3456-7890`, `+62 812…`, `812…`, nomor tidak valid), `buildWhatsAppLink`.
  - **Selesai jika:** `npm run test` hijau dengan ≥ 3 file tes; `npx playwright test --list` berjalan tanpa error; G2 lulus.

---

### Fase 1 — Design System dan Layout (paralel dengan Fase 2)

- [ ] **P1-01 · Token dan font** `S` · butuh: P0-03
  - **Kerjakan:** Terapkan token §12.2 di `app/globals.css`; muat font §12.3 di `app/layout.tsx`; latar `ivory`, teks `espresso`.
  - **Selesai jika:** Warna dan font tampil sesuai; rasio kontras teks utama dan tombol utama dihitung dan dicatat di Handoff Log (≥ 4,5:1).

- [ ] **P1-02 · shadcn/ui dasar** `M` · butuh: P0-04, P1-01
  - **Kerjakan:** `npx shadcn@latest init` (netral; sesuaikan variabel dengan pemetaan §12.2), lalu `add`: `button input label textarea select checkbox radio-group dialog sheet dropdown-menu badge table tabs skeleton separator sonner form`.
  - **Selesai jika:** Komponen ada di `components/ui`; contoh Button dan Input tampil dengan warna token; halaman uji dihapus; build lulus.

- [ ] **P1-03 · Layout toko** `M` · butuh: P1-02
  - **Kerjakan:** Grup `app/(store)/layout.tsx`; `SiteHeader` (wordmark, navigasi 8 kategori + Sale, tombol cari, ikon keranjang dengan badge placeholder, ikon akun), `MobileNavigation` (Sheet), `SiteFooter` (tautan §8.1, kontak dari `config/site.ts`), `AnnouncementBar`. Data kategori sementara dari `lib/mock/categories.ts` (dihapus di P4-04).
  - **Selesai jika:** Responsif 320–1440 px; dapat dioperasikan keyboard; build lulus; tanpa error konsol.

- [ ] **P1-04 · Komponen presentasional** `M` · butuh: P1-02
  - **Kerjakan:** `ProductCard`, `ProductGrid`, `CategoryCard`, `PriceDisplay` (harga coret + persen hemat), `StockBadge`, `EmptyState`, `LoadingState`, `ErrorState`. Tipe `ProductListItem` di `types/domain.ts`; data dummy di `lib/mock/products.ts` (sementara).
  - **Selesai jika:** Grid 2/3/4 kolom benar; tes unit untuk persentase hemat `PriceDisplay`; build lulus.

- [ ] **P1-05 · Beranda statis** `M` · butuh: P1-03, P1-04
  - **Kerjakan:** Hero (gambar placeholder di `public/images/placeholders/`), grid 8 kategori, bagian "Produk Terbaru" (mock), `not-found.tsx`, `error.tsx`.
  - **Selesai jika:** Sesuai arah desain §12.1 dan responsif; **tidak ada** klaim, testimoni, atau angka karangan; teks final ditandai `TODO(owner)`. G2 lulus.

---

### Fase 2 — Database dan Keamanan (paralel dengan Fase 1)

- [ ] **P2-00 · [PEMILIK] Project Supabase dev** `S` · butuh: —
  - **Kerjakan (pemilik):** Buat project Supabase **dev** (region terdekat, mis. Singapura). Di pengaturan database, pastikan opsi **"Automatically expose new tables and functions" = OFF**. Di API Keys ambil *publishable key* dan *secret key*; isi `.env.local` (jangan kirim nilainya ke chat). Di Authentication → URL Configuration: Site URL `http://localhost:3000`, Redirect URL `http://localhost:3000/**`. Jalankan `npx supabase login` lalu `npx supabase link --project-ref <ref>`.
  - **Selesai jika:** `.env.local` terisi; `npx supabase projects list` menampilkan project ter-link; pemilik memberi tahu agent bahwa P2-00 selesai. **Agent tidak boleh `db push` sebelum ini selesai.**

- [ ] **P2-01 · Inisialisasi Supabase CLI** `S` · butuh: P2-00
  - **Kerjakan:** `npx supabase init` (menghasilkan `supabase/config.toml`); jangan menimpa file yang sudah ada.
  - **Selesai jika:** `supabase/` ada; `npx supabase migration list` berjalan terhadap project tertaut.

- [ ] **P2-02 · Migration 0001 fondasi** `S` · butuh: P2-01
  - **Kerjakan:** `npx supabase migration new foundation`; isi dengan SQL §11.3; `npx supabase db push`.
  - **Selesai jika:** Push berhasil tanpa error; enum, fungsi, dan `store_settings` ada di dashboard.

- [ ] **P2-03 · Migration 0002 identity** `S` · butuh: P2-02
  - **Kerjakan:** Migration `identity` berisi SQL §11.4 (0002). Tambahkan `alter table … enable row level security;` segera setelah setiap `create table` (sabuk pengaman; idempoten dengan 0006). Push.
  - **Selesai jika:** Push berhasil; trigger `on_auth_user_created` ada.

- [ ] **P2-04 · Migration 0003 catalog** `S` · butuh: P2-03
  - **Kerjakan:** Migration `catalog` berisi SQL §11.4 (0003) + `enable row level security` per tabel. Push.
  - **Selesai jika:** Push berhasil; constraint dan indeks (termasuk trigram) ada.

- [ ] **P2-05 · Migration 0004 commerce** `M` · butuh: P2-04
  - **Kerjakan:** Migration `commerce` berisi SQL §11.4 (0004) + `enable row level security` per tabel. Push.
  - **Selesai jika:** Push berhasil; `chk_order_total` dan `chk_line_total` ada.

- [ ] **P2-06 · Migration 0005 fungsi bisnis** `L` · butuh: P2-05
  - **Kerjakan:**
    - [ ] a. Migration `functions`: trigger `log_order_change`, `log_initial_stock` dan fungsi `create_order`, `release_order_stock`, `cancel_order`, `expire_unpaid_orders`, `submit_payment_proof`, `verify_payment`, `adjust_stock` persis §11.5.
    - [ ] b. Tulis `reject_payment`, `mark_order_shipped`, `complete_order`, `mark_refunded` mengikuti kontrak §11.6 dan pola §11.5.
    - [ ] c. Push; perbaiki error sintaks bila ada dan catat perubahan SQL di Handoff Log.
  - **Selesai jika:** Push berhasil; 11 fungsi bisnis (7 pada §11.5 + 4 pada §11.6) dan 2 fungsi trigger terdaftar (verifikasi lewat tes P2-12).

- [ ] **P2-07 · Migration 0006 RLS dan GRANT** `M` · butuh: P2-06
  - **Kerjakan:** Migration `rls_and_grants` berisi SQL §11.7. Tambahkan `GRANT EXECUTE … TO authenticated` untuk `reject_payment`, `mark_order_shipped`, `complete_order`, `mark_refunded`. Tambahkan fungsi `public.audit_tables_without_rls()` (`security definer`, hanya `service_role`) yang mengembalikan nama tabel di `public` tanpa RLS, untuk dipakai tes.
  - **Selesai jika:** Push berhasil; `audit_tables_without_rls()` mengembalikan kosong (diverifikasi di P2-12).

- [ ] **P2-08 · Migration 0007 storage** `S` · butuh: P2-07
  - **Kerjakan:** Migration `storage` berisi SQL §11.8. Push.
  - **Selesai jika:** Dua bucket ada dengan batas ukuran dan MIME yang benar; `product-images` publik, `payment-proofs` privat.

- [ ] **P2-09 · Migration 0008 cron** `S` · butuh: P2-07
  - **Kerjakan:** Migration `cron_expire_orders` (§11.9). Jika ekstensi tidak dapat diaktifkan lewat migration, catat dan minta pemilik mengaktifkannya di dashboard (Integrations → Cron) lalu jalankan `cron.schedule`.
  - **Selesai jika:** `select jobname, schedule from cron.job` menampilkan `expire-unpaid-orders` (diverifikasi pemilik atau tes).

- [ ] **P2-10 · Data referensi dan contoh** `S` · butuh: P2-07
  - **Kerjakan:** Migration `reference_data` (§11.9: 8 kategori, `store_settings`, tarif default). Buat `supabase/dev/sample_products.sql` **[DEV ONLY]** berisi 4–6 produk contoh (lintas kategori, dengan varian, harga, stok, satu produk berharga coret, satu varian stok 0), dijalankan manual di project dev.
  - **Selesai jika:** 8 kategori ada; `store_settings` punya satu baris; contoh produk muncul di dev; tarif default ditandai `TODO(owner)`.

- [ ] **P2-11 · Tipe dan konfigurasi Next.js** `S` · butuh: P2-10
  - **Kerjakan:** `npm run db:types` → `types/database.types.ts`. Di `next.config.ts` tambahkan `images.remotePatterns` untuk host dari `NEXT_PUBLIC_SUPABASE_URL` (path `/storage/v1/object/public/**`) dan `bodySizeLimit` Server Actions `4mb` (sesuai dokumentasi versi terpasang).
  - **Selesai jika:** `npm run typecheck` dan `npm run build` lulus dengan tipe `Database`.

- [ ] **P2-12 · Tes keamanan database** `L` · butuh: P2-11, P0-08
  - **Kerjakan:**
    - [ ] a. `tests/security/helpers.ts`: klien `anon`, `service`, serta pembuatan pengguna uji (pelanggan A, pelanggan B, staf, admin) lewat `auth.admin.createUser`, pemberian `staff_roles` lewat service, login untuk memperoleh klien terautentikasi, dan **pembersihan** semua data uji (prefiks `rls-test`).
    - [ ] b. Tes baris matriks §11.10 untuk anon, pelanggan, staf, admin.
    - [ ] c. Tes `create_order` (validasi, snapshot harga, ongkir, idempotensi), `expire_unpaid_orders`, `cancel_order` (stok kembali sekali), dan `audit_tables_without_rls()` kosong.
  - **Selesai jika:** `npm run test:rls` hijau; semua baris §11.10 tercakup; tes tidak meninggalkan data; hasil ringkas ditempel di Handoff Log.

> **Gerbang Fase 2:** G2 + G3 lulus sebelum Fase 3 dimulai.

---

### Fase 3 — Autentikasi dan Akun

- [ ] **P3-01 · Klien Supabase dan proxy** `M` · butuh: P2-11
  - **Kerjakan:** `lib/supabase/{client,server,public,admin,proxy}.ts` dan `proxy.ts` di root sesuai §10.5–10.6 (jika Next.js < 16 gunakan `middleware.ts` dan catat). Cocokkan dengan dokumentasi Supabase SSR untuk versi `@supabase/ssr` terpasang.
  - **Selesai jika:** Build lulus; `curl -I http://localhost:3000/admin` tanpa cookie menghasilkan redirect ke `/login?next=/admin`; `lib/supabase/admin.ts` diawali `import 'server-only'`.

- [ ] **P3-02 · Guard dan pemetaan error** `M` · butuh: P3-01
  - **Kerjakan:** `lib/auth/guards.ts` (§10.6); `lib/errors.ts` dengan `mapDbError(error)` yang menerjemahkan awalan pesan dan SQLSTATE sesuai §9.6 menjadi `{ code, message }`.
  - **Selesai jika:** Tes unit `mapDbError` untuk setiap kode di §9.6 lulus; guard lolos typecheck.

- [ ] **P3-03 · Halaman autentikasi** `L` · butuh: P3-02
  - **Kerjakan:**
    - [ ] a. `lib/validations/auth.ts` (daftar: nama, email, kata sandi ≥ 8 karakter; masuk; lupa; reset).
    - [ ] b. `actions/auth.actions.ts`: `signUp` (dengan `full_name` dan `emailRedirectTo` ke `/auth/callback`), `signIn`, `signOut`, `requestPasswordReset`, `updatePassword`. Pesan lupa kata sandi bersifat generik (tidak membocorkan apakah email terdaftar).
    - [ ] c. Halaman `/login`, `/register`, `/forgot-password`, `/reset-password` (form RHF + Zod, a11y §12.5).
    - [ ] d. `app/auth/callback/route.ts`: tukar kode/token menjadi sesi sesuai dokumentasi; parameter `next` **hanya** path relatif yang diawali `/` dan bukan `//` (selain itu abaikan, default `/account`).
  - **Selesai jika:** Daftar → konfirmasi email (bila aktif) → masuk → `/account`; keluar; reset kata sandi berjalan; tes unit untuk validasi `next` (menolak `//evil.com`, `https://evil.com`, `/\evil`); G2 lulus.

- [ ] **P3-04 · Akun pelanggan** `M` · butuh: P3-03
  - **Kerjakan:** `app/account/layout.tsx` dengan `requireUser()`; `/account` (ringkasan); `/account/profile` (nama, telepon dinormalisasi); `/account/addresses` (CRUD; provinsi dari `config/regions.ts`; satu alamat utama). Semua lewat klien sesi (RLS).
  - **Selesai jika:** Pengguna hanya melihat dan mengubah alamat miliknya; tidak login → `/login`; validasi Zod di server; build lulus.

- [ ] **P3-05 · [PEMILIK] Admin pertama** `S` · butuh: P3-03
  - **Kerjakan (pemilik):** Daftar akun lewat `/register`, lalu jalankan SQL "Admin pertama" (§11.9) di SQL Editor dengan email sendiri.
  - **Selesai jika:** `select * from public.staff_roles` menampilkan satu baris `admin`; pemilik memberi tahu agent.

---
### Fase 4 — Katalog Publik

- [ ] **P4-01 · Service katalog dan view listing** `M` · butuh: P3-01, P2-10
  - **Kerjakan:**
    - [ ] a. Migration baru `product_listing_view`: view `public.product_listing` dengan `security_invoker = true` berisi `id, slug, name, category_id, category_slug, is_featured, created_at, min_price, max_price, in_stock` (`bool_or(is_active and stock_quantity > 0)`), `on_sale` (`bool_or(compare_at_price is not null)`), `image_path` (gambar pertama menurut `sort_order`), `sizes` dan `colors` (array unik dari varian aktif). Hanya varian aktif yang dihitung. `GRANT SELECT` ke `anon, authenticated`. Push, lalu `npm run db:types`.
    - [ ] b. `lib/validations/catalog.ts`: Zod untuk parameter URL (`page ≥ 1`, `sort` ∈ `newest|price_asc|price_desc`, `category`, `size[]`, `color[]`, `min`, `max`, `q` dipangkas dan maksimal 80 karakter).
    - [ ] c. `services/catalog.service.ts` (`import 'server-only'`, klien `public.ts`): `getCategories`, `getFeaturedProducts`, `getLatestProducts`, `listProducts(params)`, `getSaleProducts`, `searchProducts`, `getProductBySlug`. Escape `%`, `_`, `\` pada `q` sebelum `ILIKE`. Filter harga: `min_price ≤ max` dan `max_price ≥ min`.
  - **Selesai jika:** Tes unit parsing parameter lulus; tes integrasi terhadap data contoh dev membuktikan filter, urutan, dan paginasi benar; `q` berisi `%` tidak merusak hasil; produk dan varian nonaktif tidak pernah muncul.

- [ ] **P4-02 · Halaman daftar produk** `L` · butuh: P4-01, P1-04
  - **Kerjakan:**
    - [ ] a. `ProductFilters` (Client Component; memperbarui URL), `SortSelector`, `Pagination`.
    - [ ] b. Halaman `/products`, `/categories/[slug]`, `/sale`, `/search` (selalu `await searchParams`/`params`).
    - [ ] c. `loading.tsx`, `EmptyState`, `generateMetadata`, kategori tidak ada/nonaktif → `notFound()`.
  - **Selesai jika:** Filter, urutan, dan halaman bekerja lewat URL yang dapat dibagikan; ponsel dan desktop benar; metadata unik; G2 lulus.

- [ ] **P4-03 · Detail produk** `L` · butuh: P4-01
  - **Kerjakan:**
    - [ ] a. `/products/[slug]` mengambil produk beserta varian dan gambar.
    - [ ] b. `ProductGallery` (thumbnail, dapat dioperasikan keyboard), `VariantSelector` (hanya opsi dari varian aktif; kombinasi tidak tersedia/habis ditandai), harga dan stok mengikuti varian terpilih.
    - [ ] c. `generateMetadata` dan JSON-LD `Product` (§13.1) dari data aktual.
    - [ ] d. Tombol "Tambah ke Keranjang" dirender; handler diisi di P5-03 (`TODO(P5-03)`). Bagian "Produk terkait" (kategori sama, 4 item).
  - **Selesai jika:** Memilih varian memperbarui harga dan stok; produk nonaktif → 404; JSON-LD valid; tidak ada layout shift pada galeri; G2 lulus.

- [ ] **P4-04 · Beranda memakai data nyata** `M` · butuh: P4-02
  - **Kerjakan:** Ganti seluruh `lib/mock/*` dengan data dari service katalog; navigasi kategori dari database; hapus folder `lib/mock`.
  - **Selesai jika:** `grep -r "lib/mock" app components lib` kosong; beranda dan navigasi menampilkan data database; G2 lulus.

---

### Fase 5 — Keranjang

- [ ] **P5-01 · Store keranjang** `M` · butuh: P0-08
  - **Kerjakan:** `stores/cart.store.ts` dengan Zustand `persist` (kunci `hairy-cart-v1`, ada `version`). Hanya menyimpan `{ variantId, quantity }`. Aksi: `add` (gabungkan baris sama, batas 20), `setQuantity`, `remove`, `clear`; selector jumlah item. Tangani hidrasi agar tidak ada ketidakcocokan SSR (render nilai pasti hanya setelah mount).
  - **Selesai jika:** Tes unit (tambah, gabung, batas 20, ubah jumlah, hapus, kosongkan, persistensi); tidak ada peringatan hidrasi.

- [ ] **P5-02 · Snapshot keranjang dari server** `M` · butuh: P5-01, P4-01
  - **Kerjakan:** `actions/cart.actions.ts` → `getCartSnapshot(lines)`: validasi Zod (maks 30 baris, uuid, jumlah 1–20), baca varian lewat klien publik (RLS hanya mengembalikan yang aktif), kembalikan per baris nama, slug, gambar, ukuran, warna, harga, harga coret, stok, dan `status`: `ok | out_of_stock | insufficient (tersedia n) | unavailable`. Fungsi murni `computeCartView` dipisahkan agar dapat ditest.
  - **Selesai jika:** Tes unit `computeCartView` untuk semua status; harga selalu berasal dari database, bukan dari klien.

- [ ] **P5-03 · UI keranjang** `L` · butuh: P5-02, P4-03
  - **Kerjakan:**
    - [ ] a. Isi handler `AddToCartButton` pada detail produk (hilangkan `TODO(P5-03)`).
    - [ ] b. `CartSheet` di header dengan badge jumlah (menggantikan placeholder).
    - [ ] c. `/cart`: `CartItem`, `QuantitySelector`, `CartSummary` (subtotal; ongkir dihitung saat checkout), peringatan untuk baris bermasalah, tautan ke `/checkout` nonaktif bila ada baris tidak `ok`.
    - [ ] d. Keadaan keranjang kosong.
  - **Selesai jika:** Tambah/ubah/hapus bekerja dan bertahan setelah muat ulang; baris tidak tersedia ditandai dan memblokir checkout; a11y terpenuhi; G2 lulus.

---

### Fase 6 — Checkout dan Pesanan

- [ ] **P6-01 · Skema validasi checkout** `S` · butuh: P0-05
  - **Kerjakan:** `lib/validations/checkout.ts`: `customerSchema` (nama 2–80, telepon dinormalisasi `62…`, email opsional), `addressSchema` (provinsi ∈ `regions`, kota, kecamatan, kode pos `^\d{5}$`, detail 10–300), `checkoutSchema` (`idempotencyKey` uuid, `customer`, `address`, `items[]` ≤ 30, `notes` ≤ 300). Skema **tidak** menerima harga atau total.
  - **Selesai jika:** Tes unit dengan input valid dan tidak valid lulus.

- [ ] **P6-02 · Perhitungan total** `S` · butuh: P0-05
  - **Kerjakan:** `lib/pricing/calculate-totals.ts`: `calculateTotals({ lines, shippingCost, discount = 0 })` → `{ subtotal, shippingCost, discount, grandTotal }`, semua integer; melempar error bila ada nilai non-integer/negatif. Dipakai untuk **pratinjau UI**; otoritas tetap `create_order`.
  - **Selesai jika:** Tes unit mencakup kasus normal, nol, dan input tidak valid.

- [ ] **P6-03 · Service ongkir** `S` · butuh: P4-01
  - **Kerjakan:** `services/shipping.service.ts` → `getShippingQuote(province)` memakai aturan yang sama dengan `create_order` (provinsi cocok dulu, lalu `*`); kembalikan `{ cost, label, estimatedDays } | null`. Server Action `quoteShipping(province)` untuk UI.
  - **Selesai jika:** Tes terhadap data dev: provinsi tanpa baris khusus memakai tarif `*`; baris nonaktif diabaikan.

- [ ] **P6-04 · Halaman checkout** `L` · butuh: P5-03, P6-01, P6-02, P6-03
  - **Kerjakan:**
    - [ ] a. `CheckoutForm` + `AddressFields` (RHF + Zod); bila login, isi awal dari profil dan alamat utama (dimuat di server).
    - [ ] b. Ringkasan: ambil ulang snapshot keranjang saat mount; tampilkan ongkir dari `quoteShipping`; total dari `calculateTotals`, dengan catatan bahwa total final dikonfirmasi saat pesanan dibuat.
    - [ ] c. `idempotencyKey` dibuat sekali per sesi pengisian (`crypto.randomUUID()`); dibuat ulang bila isi keranjang berubah atau setelah pesanan sukses; dipakai ulang pada percobaan ulang.
    - [ ] d. Tombol kirim nonaktif saat memproses; keranjang kosong → arahkan ke `/cart`.
  - **Selesai jika:** Validasi dan pesan error benar; ongkir tampil sesuai provinsi; klik ganda tidak mengirim dua kali; a11y terpenuhi; G2 lulus.

- [ ] **P6-05 · Aksi `placeOrder`** `L` · butuh: P6-04, P2-12
  - **Kerjakan:**
    - [ ] a. `services/orders.service.ts` → `createOrderFromCheckout(client, input, userId)`: **menerima klien Supabase sebagai argumen** (admin client dibuat di action, sehingga file service tidak mengimpor `lib/supabase/admin`, sesuai §10.5); memeriksa `store_settings.bank_accounts` tidak kosong (§14.1), memanggil `client.rpc('create_order', …)`, memetakan error via `mapDbError`, mencoba ulang **sekali** bila SQLSTATE `23505`.
    - [ ] b. `actions/checkout.actions.ts` → `placeOrder(input)`: `getCurrentUser()` menentukan `user_id` (tidak pernah dari input) → validasi Zod → `createAdminClient()` → service → `ActionResult<{ orderNumber, publicToken? }>`. `publicToken` hanya dikembalikan untuk tamu.
    - [ ] c. Klien: bila sukses, kosongkan keranjang lalu `router.push('/orders/<nomor>' + (token ? '?token=' + token : ''))`.
  - **Selesai jika:** Pesanan tercipta dengan total dari server; stok berkurang; percobaan ulang dengan kunci sama tidak membuat pesanan ganda; error stok/varian/alamat tampil ramah; tidak ada PII atau token di log; G2 lulus.

- [ ] **P6-06 · Halaman pesanan** `L` · butuh: P6-05
  - **Kerjakan:**
    - [ ] a. `services/orders.public.service.ts` → `getOrderForViewer({ orderNumber, token? })` (admin client): izinkan bila `session.user.id === order.user_id` **atau** token cocok (perbandingan *timing-safe* dengan `crypto.timingSafeEqual`); selain itu kembalikan `null` → `notFound()`. DTO hanya memuat data yang dibutuhkan halaman (item, alamat, total, status, riwayat, pengiriman, percobaan pembayaran terbaru, rekening tujuan).
    - [ ] b. Halaman `/orders/[orderNumber]`: `OrderStatusBadge`, `OrderTimeline`, daftar item (snapshot), alamat, total, info pengiriman/resi.
    - [ ] c. `PaymentInstructions` (rekening dari pengaturan, nominal, tombol salin) dan `ExpiryCountdown`; area `ProofUploader` (diisi P7-01, `TODO(P7-01)`).
    - [ ] d. `robots: { index: false }`, `referrer: no-referrer`; tombol WhatsApp ditambahkan di P7-02.
  - **Selesai jika:** Tanpa token dan bukan pemilik → 404 (tidak membocorkan keberadaan pesanan); token benar → tampil; tes unit untuk fungsi otorisasi (pemilik, token benar, token salah, tanpa keduanya); G2 lulus.

- [ ] **P6-07 · Daftar pesanan akun** `S` · butuh: P6-06, P3-04
  - **Kerjakan:** `/account/orders` lewat klien sesi (RLS): nomor, tanggal, badge status, total, tautan ke `/orders/[nomor]`; paginasi 10.
  - **Selesai jika:** Hanya pesanan milik sendiri; keadaan kosong benar.

- [ ] **P6-08 · Tes alur checkout** `M` · butuh: P6-05, P6-06
  - **Kerjakan:** Tes integrasi (`tests/security/checkout.test.ts`) terhadap service `createOrderFromCheckout` (klien admin dibuat di dalam tes): field harga ekstra pada input diabaikan dan total tetap dari database (S3); setelah harga produk diubah dan produk dinonaktifkan, pesanan lama tetap menampilkan snapshot semula (S6); idempotensi; stok kurang; bank_accounts kosong ditolak; tarif default `*`. Tambahkan E2E pertama: katalog → keranjang → checkout tamu → halaman pesanan.
  - **Selesai jika:** G3 dan G4 lulus.

> **Gerbang Fase 6:** G2 + G3 + G4. Konfirmasi pemilik atas D-06, D-10, D-11 sudah tercatat di §19.

---

### Fase 7 — Pembayaran Manual dan Pengiriman

- [ ] **P7-01 · Unggah bukti transfer** `L` · butuh: P6-06, P2-12
  - **Kerjakan:**
    - [ ] a. `lib/validations/payment.ts` (bank ≤ 50, nama pengirim ≤ 80, catatan ≤ 200) dan `lib/utils/file-signature.ts` (cek *magic bytes* JPEG/PNG/WebP) beserta tes unit.
    - [ ] b. `ProofUploader` (klien): pilih file, pratinjau, kecilkan via canvas (sisi terpanjang ±1600 px, JPEG kualitas 0,8), kirim `FormData`.
    - [ ] c. `actions/payment.actions.ts` → `submitPaymentProof(formData)`: otorisasi pemilik/token (sama dengan P6-06), cek tipe via signature dan ukuran ≤ 4 MB, unggah dengan admin client ke `payment-proofs/<order_id>/<uuid>.<ext>` (tanpa `upsert`), panggil `submit_payment_proof`; bila RPC gagal, **hapus** objek yang sudah terunggah.
    - [ ] d. Tampilan status: "Menunggu verifikasi"; bila ditolak tampilkan catatan penolakan dan izinkan unggah ulang.
  - **Selesai jika:** Unggah valid → `proof_submitted`; file non-gambar, ber-ekstensi palsu, atau > 4 MB ditolak; pesanan kedaluwarsa ditolak; tanpa token/pemilik ditolak; tidak ada objek yatim saat RPC gagal (tes); G3 lulus.

- [ ] **P7-02 · Tombol WhatsApp** `S` · butuh: P6-06
  - **Kerjakan:** Komponen `WhatsAppButton` memakai `buildWhatsAppLink` dan `store_settings.contact_whatsapp`; dipasang di halaman pesanan (pesan awal berisi nomor pesanan), `/contact`, dan footer.
  - **Selesai jika:** Tautan benar; bila nomor kosong, tombol tidak ditampilkan.

- [ ] **P7-03 · Aksi admin untuk pesanan** `M` · butuh: P3-02, P2-12
  - **Kerjakan:** `actions/admin-orders.actions.ts`: `verifyPayment`, `rejectPayment`, `markShipped`, `completeOrder`, `cancelOrder`, `markRefunded`, `getProofSignedUrl`. Setiap action: `requireStaff()` → Zod → RPC lewat **klien sesi** (agar `auth.uid()` adalah staf) → `mapDbError` → `revalidatePath`. Signed URL 60 detik lewat klien sesi (policy staf).
  - **Selesai jika:** Tes G3: non-staf `FORBIDDEN`; staf berhasil; transisi tidak sah `INVALID_TRANSITION`; signed URL hanya untuk staf.

---

### Fase 8 — Dashboard Admin

- [ ] **P8-01 · Layout admin** `M` · butuh: P3-05, P1-02
  - **Kerjakan:** `app/admin/layout.tsx` dengan `requireStaff()`, `AdminSidebar` (staf: Dashboard, Pesanan, Inventori; admin: semua menu), `DataTable` generik (paginasi sisi server), `ConfirmDialog`; responsif (sidebar menjadi Sheet di ponsel); `robots: noindex`. Setiap halaman yang khusus admin memanggil `requireAdmin()` sendiri.
  - **Selesai jika:** Belum login → `/login`; login tanpa role → 404; staf hanya melihat menu terbatas dan tidak bisa membuka halaman admin-only (404).

- [ ] **P8-02 · Dashboard** `M` · butuh: P8-01
  - **Kerjakan:** Kartu: menunggu verifikasi (`proof_submitted`), perlu dikirim (`processing`), menunggu pembayaran (`pending` + `unpaid`), stok menipis (≤ `low_stock_threshold`, varian aktif), omzet 7 dan 30 hari (jumlah `grand_total` pesanan `paid` menurut `paid_at`, tidak termasuk `cancelled`). Setiap kartu menautkan ke daftar yang sudah terfilter.
  - **Selesai jika:** Angka cocok dengan data uji; hanya staf yang dapat melihat.

- [ ] **P8-03 · Kategori** `M` · butuh: P8-01
  - **Kerjakan:** `/admin/categories`: daftar, tambah, ubah (nama, slug unik, deskripsi, gambar, `requires_size`, `size_options`, `is_active`, `sort_order`), nonaktifkan. Hapus hanya jika belum punya produk. `requireAdmin()`, `revalidatePath`.
  - **Selesai jika:** CRUD berfungsi; slug duplikat → pesan ramah; kategori nonaktif hilang dari publik; tes validasi skema.

- [ ] **P8-04 · Produk** `L` · butuh: P8-03
  - **Kerjakan:**
    - [ ] a. `/admin/products`: daftar dengan pencarian, filter kategori/status, paginasi.
    - [ ] b. Form tambah/ubah (RHF + Zod): nama, slug (otomatis dari nama, dapat diubah; bentrok → sarankan `-2`), kategori, deskripsi, bahan, perawatan, `specs` (pasangan kunci–nilai), `is_active`, `is_featured`.
    - [ ] c. Aktif/nonaktif; hapus keras hanya bila tidak pernah dipesan (D-15), selain itu tombol hapus nonaktif dengan penjelasan.
    - [ ] d. Setelah dibuat, arahkan ke halaman edit untuk menambah varian dan gambar.
  - **Selesai jika:** Produk tanpa kategori tidak bisa dibuat; slug unik; katalog publik diperbarui (`revalidatePath`); tes validasi skema.

- [ ] **P8-05 · Varian** `L` · butuh: P8-04
  - **Kerjakan:**
    - [ ] a. `VariantTable` di halaman edit produk dengan dialog tambah/ubah: SKU, ukuran (pilihan dari `size_options` bila `requires_size`, teks bebas opsional bila tidak), `color_name`, `color_hex`, `color_hex_2` (hanya relevan untuk Two Tone), harga (integer rupiah), harga coret (opsional, > harga), stok awal (hanya saat membuat).
    - [ ] b. Stok pada baris ditampilkan **baca saja**; perubahan stok lewat `StockAdjustDialog` (P8-07).
    - [ ] c. Nonaktifkan varian; hapus hanya bila tidak pernah dipesan.
  - **Selesai jika:** Kombinasi duplikat (produk, ukuran, warna) → pesan ramah; `requires_size` ditegakkan; tes G3 membuktikan klien tidak dapat meng-`update` `stock_quantity` langsung.

- [ ] **P8-06 · Gambar produk** `L` · butuh: P8-04, P2-08
  - **Kerjakan:**
    - [ ] a. `ImageUploader`: multi-file, maksimal 8 per produk, ≤ 2 MB, JPEG/PNG/WebP, kecilkan di klien (±1600 px), unggah langsung ke bucket `product-images` lewat klien sesi (policy admin) ke `<product_id>/<uuid>.<ext>`.
    - [ ] b. Simpan baris `product_images` (`storage_path`, `alt_text` wajib dengan nilai awal nama produk, `sort_order`, `variant_id` opsional).
    - [ ] c. Ubah urutan (tombol naik/turun yang dapat dioperasikan keyboard), ubah `alt_text`, hapus (baris dan objek).
  - **Selesai jika:** Non-admin ditolak; urutan tersimpan; gambar tampil di katalog dan detail; tidak ada objek yatim setelah hapus.

- [ ] **P8-07 · Inventori** `M` · butuh: P8-05
  - **Kerjakan:** `/admin/inventory`: tabel varian (produk, SKU, ukuran, warna, stok, status), filter stok menipis/habis, cari SKU. `StockAdjustDialog` (jumlah bertanda ±, alasan wajib) → `adjust_stock`. Riwayat per varian dari `stock_movements` (20 terbaru). Dapat diakses staf dan admin.
  - **Selesai jika:** Penyesuaian mengubah stok dan mencatat pergerakan; stok negatif ditolak dengan pesan ramah; G3 lulus.

- [ ] **P8-08 · Pesanan (admin)** `L` · butuh: P7-03, P8-01
  - **Kerjakan:**
    - [ ] a. `/admin/orders`: filter status, status pembayaran, rentang tanggal; cari nomor, nama, telepon; pintasan "Perlu verifikasi"; paginasi; badge status.
    - [ ] b. `/admin/orders/[id]`: pembeli, alamat, item snapshot, total, riwayat status, daftar percobaan pembayaran dengan tombol "Lihat bukti" (signed URL), info pengiriman.
    - [ ] c. Tombol aksi hanya tampil bila transisi valid menurut §9.5: Verifikasi, Tolak (catatan), Kirim (kurir, layanan, resi), Selesai, Batal (alasan), Tandai refund — semuanya dengan `ConfirmDialog`.
    - [ ] d. Tombol WhatsApp ke pelanggan.
  - **Selesai jika:** Semua transisi §9.5 dapat dilakukan dari UI dan yang tidak sah tidak tersedia; pembatalan mengembalikan stok (terlihat di inventori); G4 mencakup alur admin dasar.

- [ ] **P8-09 · Pengaturan** `M` · butuh: P8-01
  - **Kerjakan:** `/admin/settings`: form `store_settings` (nama, WhatsApp, email, alamat, rekening bank sebagai baris dinamis `{bank, account_number, account_name}`, jam kedaluwarsa, ambang stok menipis); CRUD `shipping_rates` (provinsi dari `config/regions.ts` atau `*`, label, biaya, estimasi, aktif). `requireAdmin()`.
  - **Selesai jika:** Rekening tampil di halaman pesanan; tarif baru dipakai `create_order` (tes); validasi benar.

- [ ] **P8-10 · Pelanggan (baca saja)** `S` · butuh: P8-01
  - **Kerjakan:** `/admin/customers`: nama, telepon, tanggal daftar, jumlah pesanan; paginasi. Email tidak ditampilkan karena tidak tersedia lewat RLS.
  - **Selesai jika:** Hanya admin; tidak ada data sensitif berlebih.

> **Gerbang Fase 8:** G2 + G3 + G4.

---

### Fase 9 — Konten, SEO, Performa, Aksesibilitas

- [ ] **P9-01 · Halaman informasi dan kebijakan** `M` · butuh: P1-03
  - **Kerjakan:** Komponen `StaticPage`; buat `/about`, `/size-guide`, `/care-guide`, `/contact`, `/privacy-policy`, `/terms`, `/shipping-policy`, `/returns-policy`. Isi hanya fakta yang ada di dokumen ini (transfer manual, batas bayar sesuai pengaturan, tarif flat) dan kerangka yang jelas; semua isi yang butuh keputusan/data pemilik (tabel ukuran, kebijakan retur, bahasa hukum) ditandai `TODO(owner)` dan dicatat di §19. **Dilarang mengarang** klaim, kebijakan, atau teks hukum.
  - **Selesai jika:** Delapan rute ada dan tertaut di footer; halaman dengan `TODO(owner)` memakai `robots: { index: false }` sampai isinya final.

- [ ] **P9-02 · SEO** `M` · butuh: P4-03
  - **Kerjakan:** Sesuai §13.1: `generateMetadata` di semua halaman publik, `app/sitemap.ts`, `app/robots.ts`, canonical, Open Graph, builder JSON-LD (fungsi murni dengan tes).
  - **Selesai jika:** Sitemap hanya memuat produk dan kategori aktif; robots melarang rute privat; JSON-LD valid; metadata unik per halaman.

- [ ] **P9-03 · Performa** `M` · butuh: P4-04, P5-03
  - **Kerjakan:** Audit `next/image` (`sizes`, `priority` hanya di atas lipatan), `loading.tsx`, font, ukuran bundel dari output `next build`; jalankan Lighthouse (mode ponsel) pada beranda dan detail produk.
  - **Selesai jika:** LCP < 2,5 dtk dan CLS < 0,1 pada lab atau deviasi dicatat beserta rencananya; tidak ada gambar tanpa `sizes`.

- [ ] **P9-04 · Aksesibilitas** `S` · butuh: P6-06
  - **Kerjakan:** Tes `@axe-core/playwright` pada beranda, kategori, detail, keranjang, checkout, halaman pesanan, login; telusuri dengan keyboard dan catat hasilnya.
  - **Selesai jika:** 0 pelanggaran tingkat *serious/critical*; skor aksesibilitas Lighthouse ≥ 90.

---

### Fase 10 — Pengujian dan Hardening

- [ ] **P10-01 · Melengkapi tes unit** `M` · butuh: P6-08
  - **Kerjakan:** Pastikan setiap modul murni punya tes: `lib/utils/*`, `lib/pricing`, `lib/validations/*`, `lib/errors.ts`, `stores/cart.store.ts`, builder JSON-LD, validator `next`, signature file, fungsi otorisasi pesanan.
  - **Selesai jika:** `npm run test` hijau; setiap file pada modul tersebut memiliki tes.

- [ ] **P10-02 · Matriks izin menyeluruh** `M` · butuh: P8-10
  - **Kerjakan:** Perluas `tests/security`: akses Storage (anon/pelanggan tidak dapat membaca `payment-proofs`; hanya admin dapat menulis `product-images`), `audit_tables_without_rls()` kosong, tidak ada privilege `anon` pada tabel non-publik, tidak ada `UPDATE` kolom `stock_quantity` untuk `authenticated` (periksa lewat `information_schema`/fungsi audit), serta pengujian guard `requireStaff/requireAdmin`.
  - **Selesai jika:** `npm run test:rls` hijau dan mencakup seluruh §11.10.

- [ ] **P10-03 · Konkurensi, idempotensi, kedaluwarsa** `M` · butuh: P10-02
  - **Kerjakan:** Tes: 5 pesanan paralel untuk stok 3 → tepat 3 berhasil, stok akhir 0, jumlah delta `stock_movements` = perubahan stok; dua pesanan paralel dengan varian berurutan A,B dan B,A → tidak deadlock; 5 panggilan paralel dengan `idempotency_key` sama → 1 pesanan; `expire_unpaid_orders` dan `cancel_order` dipanggil dua kali → stok tidak ganda.
  - **Selesai jika:** Seluruh tes hijau **tiga kali berturut-turut** (pemeriksaan flaky).

- [ ] **P10-04 · Tes E2E** `L` · butuh: P8-08, P7-01
  - **Kerjakan:**
    - [ ] a. Skenario pelanggan: katalog → filter → detail → keranjang → checkout tamu → halaman pesanan → unggah bukti.
    - [ ] b. Skenario admin (kredensial dari env `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`, tidak pernah dikomit): lihat bukti → verifikasi → kirim dengan resi → selesai.
    - [ ] c. Akses: pelanggan tidak dapat membuka pesanan orang lain (404); non-admin membuka `/admin` (404); stok habis tampil Sold Out.
    - [ ] d. `tests/e2e/cleanup.ts`: hapus pesanan bercatatan `[E2E]` dan kembalikan stok.
  - **Selesai jika:** `npm run test:e2e` hijau pada desktop dan ponsel; cleanup berjalan.

- [ ] **P10-05 · Hardening keamanan** `M` · butuh: P10-04
  - **Kerjakan:**
    - [ ] a. Header keamanan di `next.config.ts`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` minimal; CSP dimulai dalam mode *Report-Only*.
    - [ ] b. Pemindaian: `SUPABASE_SECRET_KEY` hanya di `lib/env.ts` dan `lib/supabase/admin.ts`; impor `lib/supabase/admin` hanya dari daftar §10.5; `grep -r "sb_secret" .next/static` kosong setelah build.
    - [ ] c. Honeypot dan batas ukuran pada form daftar dan checkout; catat rekomendasi pembatasan laju (Vercel WAF, batas Auth Supabase) sebagai tugas **[PEMILIK]** di §19.
    - [ ] d. Pastikan pesan error tidak membocorkan detail; `public_token` tidak muncul di log.
  - **Selesai jika:** Semua pemeriksaan lulus dan hasilnya dicatat; temuan yang tersisa tercatat di §17.

- [ ] **P10-06 · Audit dependensi** `S` · butuh: P10-05
  - **Kerjakan:** `npm audit`, `npm outdated`; kunci versi lewat lockfile; pastikan tidak ada paket di luar whitelist.
  - **Selesai jika:** Tidak ada kerentanan *high/critical* pada dependensi produksi, atau dicatat dengan mitigasi.

> **Gerbang Fase 10:** G2 + G3 + G4 hijau pada commit yang sama.

---

### Fase 11 — Deployment dan Peluncuran

- [ ] **P11-01 · [PEMILIK + agent] Supabase produksi** `M` · butuh: P10-06
  - **Kerjakan:** Pemilik membuat project **produksi** (paket berbayar disarankan, lihat R-09), memastikan opsi "Automatically expose new tables and functions" = OFF, dan memasukkan key ke Vercel (bukan ke chat). Agent menulis `docs/RUNBOOK.md` (cara migrasi, tautkan project yang benar, rollback, tambah admin, rotasi key, restore backup) dengan peringatan jelas agar tidak salah target dev/prod. Migration diterapkan ke produksi.
  - **Selesai jika:** `supabase migration list` konsisten antara dev dan produksi; 8 kategori dan `store_settings` ada; job cron `expire-unpaid-orders` ada.

- [ ] **P11-02 · Deploy Vercel** `M` · butuh: P11-01
  - **Kerjakan:** Hubungkan repo; isi env (Production = project produksi, Preview = project dev); `NEXT_PUBLIC_SITE_URL`; versi Node sesuai `.nvmrc`.
  - **Selesai jika:** Build sukses; URL hidup; pemindaian secret (P10-05b) diulang pada build produksi.

- [ ] **P11-03 · [PEMILIK] Domain, redirect Auth, SMTP** `S` · butuh: P11-02
  - **Kerjakan (pemilik):** Domain dan HTTPS; Supabase Auth → Site URL dan Redirect URL ke domain produksi (tanpa wildcard longgar); SMTP sendiri dengan template email berbahasa Indonesia.
  - **Selesai jika:** Registrasi dan reset kata sandi di produksi mengirim email dalam ≤ 1 menit dan tautan callback berfungsi.

- [ ] **P11-04 · [PEMILIK + agent] Data riil dan uji asap** `M` · butuh: P11-03, P9-01
  - **Kerjakan:** Pemilik memasukkan produk, varian, foto, harga, stok, rekening, tarif ongkir, dan konten halaman lewat admin. Agent menjalankan checklist §20 di produksi, termasuk satu pesanan bernilai kecil: buat → unggah bukti → verifikasi → batalkan (stok kembali).
  - **Selesai jika:** Seluruh checklist §20 tercentang.

- [ ] **P11-05 · Monitoring dan backup** `S` · butuh: P11-02
  - **Kerjakan:** Aktifkan log/analytics Vercel; periksa kebijakan backup paket Supabase (aktifkan PITR bila perlu); verifikasi `cron.job_run_details` menunjukkan eksekusi sukses; tulis prosedur restore di `docs/RUNBOOK.md`.
  - **Selesai jika:** Kebijakan backup tercatat dan job cron berjalan.

- [ ] **P11-06 · Go-live** `S` · butuh: P11-04, P11-05
  - **Kerjakan:** Pastikan §20 lengkap; perbarui `README.md` (cara menjalankan, env, perintah, tautan ke `docs/`); tag `v1.0.0`; tulis retrospektif singkat di Handoff Log; pindahkan ide baru ke §18.
  - **Selesai jika:** Semua poin di atas selesai dan pemilik menyetujui peluncuran.

---
## 16. Rencana Pengujian

| Area | Skenario | Hasil yang diharapkan | Jenis | Task |
|---|---|---|---|---|
| Katalog | Membuka kategori aktif; kategori nonaktif/tidak ada | Produk sesuai tampil; nonaktif → 404 | Integrasi, E2E | P4-02, P10-04 |
| Pencarian | `q` berisi `%`, `_`, atau spasi saja | Tidak error, hasil benar | Unit, integrasi | P4-01 |
| Varian | Memilih ukuran/warna | Harga dan stok sesuai varian | E2E | P4-03 |
| Keranjang | Ubah jumlah, batas 20, varian jadi nonaktif | Ringkasan benar; baris bermasalah memblokir checkout | Unit, E2E | P5-01–03 |
| Stok | Pesan melebihi stok | Ditolak dengan pesan jelas | Integrasi | P6-08 |
| Stok | 5 pesanan paralel untuk stok 3 | Tepat 3 berhasil | Konkurensi | P10-03 |
| Deadlock | Dua pesanan paralel dengan varian berurutan terbalik | Tidak ada deadlock | Konkurensi | P10-03 |
| Checkout | Mengirim field harga/total dari browser | Diabaikan; total dari database | Integrasi | P6-08 |
| Idempotensi | Kirim berulang dengan kunci sama (termasuk paralel) | Satu pesanan | Integrasi | P6-08, P10-03 |
| Snapshot | Ubah harga/nonaktifkan produk setelah dipesan | Pesanan lama tetap memuat data semula | Integrasi | P6-08 |
| Pesanan | Buat pesanan | Nomor unik; item dan alamat tersimpan | Integrasi | P2-12 |
| Kedaluwarsa | Pesanan `unpaid` lewat tempo | `expired`, stok kembali sekali | Integrasi | P2-12, P10-03 |
| Pembayaran | Unggah bukti: file palsu, > 4 MB, pesanan kedaluwarsa | Ditolak | Integrasi | P7-01 |
| Pembayaran | Non-staf memanggil `verify_payment` | `FORBIDDEN` | Keamanan | P2-12, P7-03 |
| Pembayaran | Pesanan tidak pernah `paid` tanpa verifikasi staf | Terbukti pada semua jalur | Keamanan | P10-02 |
| Auth | Pelanggan membuka pesanan orang lain | 404 / 0 baris | Keamanan, E2E | P10-02, P10-04 |
| Auth | Pelanggan/non-staf membuka `/admin` | 404 | E2E | P8-01, P10-04 |
| Auth | Parameter `next` berbahaya (`//evil.com`) | Diabaikan | Unit | P3-03 |
| RLS/GRANT | Permintaan langsung ke API dengan kunci publik | Hanya data yang diizinkan; sisanya `42501`/0 baris | Keamanan | P2-12, P10-02 |
| Admin | Staf mengubah harga produk | Ditolak | Keamanan | P2-12 |
| Stok | Klien `update stock_quantity` | Ditolak | Keamanan | P8-05, P10-02 |
| Storage | Anon/pelanggan membaca bukti transfer | Ditolak | Keamanan | P10-02 |
| Responsif | Alur belanja di ponsel 320–414 px | Konten dan kontrol dapat dipakai | E2E | P10-04 |
| Aksesibilitas | axe pada halaman utama | 0 pelanggaran serius/kritis | E2E | P9-04 |
| SEO | Metadata, sitemap, robots, JSON-LD | Sesuai §13.1 | Unit, manual | P9-02 |
| Deployment | Bundel dan env produksi | Tidak ada secret terekspos | Pemindaian | P10-05, P11-02 |

---

## 17. Risiko dan Mitigasi

| ID | Risiko | Mitigasi |
|---|---|---|
| R-01 | Stok tidak konsisten | `create_order` atomik dengan kunci baris; `stock_movements`; tes konkurensi |
| R-02 | Pelanggan mengubah total harga | Skema tidak menerima harga; total dihitung di database |
| R-03 | Kebocoran data pelanggan | RLS + GRANT eksplisit + token pesanan tamu + tes matriks izin |
| R-04 | Status pembayaran palsu | Hanya staf yang memverifikasi; bukti diunggah lewat server; tes |
| R-05 | Eskalasi role ke admin | Role di `staff_roles` tanpa jalur tulis dari klien |
| R-06 | Perubahan default Supabase (Data API, kunci lama deprecated) | GRANT eksplisit; kunci publishable/secret; verifikasi ulang dokumentasi (§3.2) |
| R-07 | Kode tidak konsisten karena banyak agent/model bergantian | §0 protokol, gate, whitelist, Log Keputusan, Handoff Log, tes |
| R-08 | Foto lambat dimuat | `next/image`, kompresi saat unggah, `sizes` |
| R-09 | Project Supabase gratis dijeda saat tidak aktif; cadangan terbatas | Produksi memakai paket berbayar; backup/PITR (P11-01, P11-05) |
| R-10 | Pesanan kedaluwarsa tetapi dibayar belakangan | Prosedur manual (D-25); fitur buka kembali di tahap 2 |
| R-11 | Token pesanan tamu bocor lewat URL | Token 122-bit, `noindex`, `Referrer-Policy`, tidak dicatat di log; pemilik memahami risikonya |
| R-12 | Spam/abuse pada daftar dan checkout | Honeypot, batas Auth Supabase, rate limit/WAF Vercel (**[PEMILIK]**), captcha tahap 2 |
| R-13 | Scope membesar | §5 dan aturan emas #7; ide baru ke §18 |
| R-14 | Perubahan framework merusak build | Lockfile; baca dokumentasi versi terpasang; gate G2 |
| R-15 | Teks kebijakan/hukum belum ada | `TODO(owner)` + `noindex` sampai final; tinjau profesional |
| R-16 | Data produk dan foto belum siap | Placeholder terstruktur; P11-04 bergantung pada pemilik |
| R-17 | Ketergantungan pada satu developer atau satu akun agent | Dokumen ini, Handoff Log, RUNBOOK, Git, migration |
| R-18 | Email Auth bawaan terbatas | SMTP sendiri (P11-03) |

---

## 18. Roadmap Pasca-MVP

**Tahap 2 — Optimasi e-commerce:** voucher dan promosi (`promotions`, `promotion_redemptions`), wishlist, ulasan, notifikasi email/WhatsApp otomatis, payment gateway (§14.1), ongkir otomatis (§14.2), kode unik transfer, buka kembali pesanan kedaluwarsa (`reopen_order`), laporan dan ekspor CSV, optimasi SEO dan konversi.

**Tahap 3 — Multi-tenant SaaS** (setelah kebutuhan bisnis tervalidasi): tabel `tenants`, `tenant_members`, `subscription_plans`, `subscriptions`, `billing_events`, `tenant_domains`, `platform_settings`; `tenant_id` pada tabel milik toko; RLS berbasis tenant; pemisahan otorisasi platform dan tenant; `staff_roles` menjadi keanggotaan per tenant; pengujian isolasi data antar tenant.

**Tahap 4 — Skalabilitas:** monitoring dan logging terpusat, strategi backup dan pemulihan teruji, pembatasan permintaan dan proteksi abuse, observabilitas transaksi, uji beban, dokumentasi operasional dan prosedur insiden.

Ide baru yang muncul saat pengerjaan dicatat di sini oleh agent (satu baris per ide), **tidak dikerjakan**.

---

## 19. Pertanyaan Terbuka untuk Pemilik

Agent tidak boleh menunggu jawaban jika ada nilai default; pakai default dan catat. Pemilik cukup membalas dengan nomor Q.

| ID | Pertanyaan | Default bila tidak dijawab | Mempengaruhi |
|---|---|---|---|
| Q-01 | Guest checkout (D-06) diizinkan? | Ya | P6-04–P6-06 |
| Q-02 | Pembayaran MVP transfer manual (D-10)? | Ya | P6-05, P7 |
| Q-03 | Tarif ongkir: flat satu tarif atau per provinsi? Nominalnya? | Satu tarif Rp 20.000 (placeholder) | P2-10, P8-09, **peluncuran** |
| Q-04 | Rekening tujuan transfer (bank, nomor, atas nama) | Diisi lewat `/admin/settings` | **peluncuran** |
| Q-05 | Nomor WhatsApp dan email resmi toko | Diisi lewat `/admin/settings` | P7-02, P9-01 |
| Q-06 | Batas waktu bayar 24 jam sudah sesuai? (D-09) | 24 jam | P2-02 |
| Q-07 | Logo, foto merek, dan gambar Open Graph | Wordmark teks, tanpa OG khusus | P1, P9-02 |
| Q-08 | Tabel ukuran dan petunjuk perawatan resmi | Halaman `noindex` dengan kerangka | P9-01 |
| Q-09 | Kebijakan privasi, syarat layanan, pengiriman, pengembalian (teks resmi) | Kerangka `noindex` | P9-01, **peluncuran** |
| Q-10 | Data produk awal: nama, deskripsi, bahan, SKU, harga, stok, foto | Contoh [DEV ONLY] | P11-04 |
| Q-11 | Domain yang akan dipakai | Domain bawaan Vercel | P11-03 |
| Q-12 | Email admin pertama dan staf tambahan (bila ada) | Email pemilik | P3-05 |
| Q-13 | Perlu batas maksimal pembelian per produk selain 20 per baris? | Tidak | P6-01 |
| Q-14 | Aktifkan rate limit/WAF Vercel dan captcha pada daftar/checkout? | Honeypot saja | P10-05 |
| Q-15 | Paket Supabase produksi (backup/PITR) | Paket berbayar terendah | P11-01, P11-05 |
| Q-16 | Kebijakan pesanan kedaluwarsa yang dibayar belakangan (D-25) | Hubungi pelanggan / refund manual | R-10 |

**Daftar `TODO(owner)` yang ada di kode** (agent menambah satu baris setiap menaruh penanda): *(kosong)*

---

## 20. Checklist Peluncuran

### Brand dan katalog
- [ ] Logo dan identitas visual final terpasang.
- [ ] Delapan kategori ada dan aturan ukuran benar.
- [ ] Data produk, harga, foto, dan deskripsi diverifikasi pemilik.
- [ ] Varian, SKU, dan stok awal diverifikasi.

### Teknis dan keamanan
- [ ] Semua migration dapat dijalankan dari nol pada lingkungan baru (`supabase db reset` lokal atau project kosong).
- [ ] RLS aktif pada semua tabel (`audit_tables_without_rls()` kosong) dan GRANT sesuai §11.7.
- [ ] Role admin ditetapkan lewat SQL; tidak ada jalur publik untuk menaikkan role.
- [ ] Tidak ada secret di repo, bundel klien, atau log (P10-05).
- [ ] Harga, ongkir, dan stok divalidasi di server; tes S2 dan S3 lulus.
- [ ] Pembatasan laju dan proteksi spam dikonfigurasi sesuai keputusan Q-14.
- [ ] Backup dan penanganan error disiapkan (P11-05).

### Transaksi dan operasional
- [ ] Keranjang, checkout, halaman pesanan diuji di produksi.
- [ ] Rekening tujuan dan tarif ongkir benar.
- [ ] Unggah bukti → verifikasi → kirim → selesai berjalan; pembatalan mengembalikan stok.
- [ ] Pembersihan pesanan kedaluwarsa berjalan (cron).
- [ ] Kebijakan privasi, syarat, pengiriman, dan pengembalian final dan tidak lagi `noindex`.

### Produksi
- [ ] Tampilan desktop dan ponsel diuji.
- [ ] Metadata SEO, sitemap, dan robots diperiksa.
- [ ] Domain dan HTTPS siap; redirect Auth dan SMTP berfungsi.
- [ ] Alur end-to-end lulus di produksi dengan pesanan uji.
- [ ] Monitoring dasar tersedia; `docs/RUNBOOK.md` lengkap.

---

## 21. Dokumentasi Acuan

Gunakan dokumentasi resmi untuk **versi yang terpasang** (periksa `package.json`). Konvensi cepat berubah; verifikasi ulang sebelum mengimplementasikan.

- Next.js — instalasi: <https://nextjs.org/docs/app/getting-started/installation>
- Next.js — App Router: <https://nextjs.org/docs/app>
- Next.js — Proxy (pengganti middleware): <https://nextjs.org/docs/app/getting-started/proxy>
- Supabase — SSR dengan Next.js: <https://supabase.com/docs/guides/auth/server-side/nextjs>
- Supabase — membuat klien SSR: <https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs>
- Supabase — Row Level Security: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase — Storage: <https://supabase.com/docs/guides/storage>
- Supabase — perubahan ekspos tabel Data API (GRANT eksplisit): <https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically>
- Supabase — Cron: <https://supabase.com/docs/guides/cron>
- Tailwind CSS untuk Next.js: <https://tailwindcss.com/docs/installation/framework-guides/nextjs>
- shadcn/ui: <https://ui.shadcn.com/docs>
- Zod: <https://zod.dev>
- Vitest: <https://vitest.dev/guide/>
- Playwright: <https://playwright.dev/docs/intro>
- Vercel: <https://vercel.com/docs>

---

## Lampiran A — Blok yang ditambahkan ke `AGENTS.md`

Tempel **di bawah** isi `AGENTS.md` bawaan (jangan menghapusnya). Untuk Claude Code, buat `CLAUDE.md` berisi satu baris: `@AGENTS.md`.

```markdown
<!-- BEGIN HAIRY HIJAB -->
## Hairy Hijab — Aturan Proyek (wajib dibaca agent)

Sumber kebenaran proyek: `docs/PROJECT_PLAN.md`. Kamu tidak punya riwayat chat; semua konteks ada di repo.

Setiap sesi:
1. Baca `docs/PROJECT_PLAN.md` §0 (Protokol Agent) dan §1 (STATUS SAAT INI), lalu 5 entri terakhir Lampiran D (Handoff Log).
2. Kerjakan HANYA "Task berikutnya". Satu task per waktu. Entri `WIP` dilanjutkan dari "Langkah berikutnya".
3. Gate sebelum selesai: `npm run lint && npm run typecheck && npm run test` (akhir fase: tambah `npm run build`).
4. Akhir sesi (juga saat kuota hampir habis): centang task, perbarui §1, tambah entri Lampiran D, commit.

Larangan: tidak menaruh/mencetak secret atau isi `.env*`; admin client Supabase hanya di file yang diizinkan §10.5;
jangan percaya harga/total/role/user_id dari browser; stok hanya berubah lewat fungsi database;
jangan edit migration yang sudah di-push; jangan tambah dependensi di luar whitelist §10.1; jangan tambah scope;
jangan mengarang konten hukum, kebijakan, data produk, atau klaim bisnis.

Prompt dan persetujuan (Lampiran E, §0.11): pemilik bekerja dengan prompt berurutan.
- Pesan diawali "/1allclear" (atau "1allclear") = pemilik menyetujui prompt SEBELUMNYA: tandai DISETUJUI di Lampiran E, lalu kerjakan prompt ini.
- Tanpa awalan itu dan prompt sebelumnya belum DISETUJUI = berhenti dan tanya; jangan lanjut.
- Prompt yang selesai berstatus MENUNGGU; hanya pemilik yang menyetujui. Pengulangan = percobaan ulang; catat penyebab di Riwayat percobaan.

Jika ragu: cek kode → dokumentasi resmi versi terpasang → Log Keputusan §4 → pilih opsi paling aman,
catat sebagai Asumsi di Handoff Log, lalu lanjutkan.
<!-- END HAIRY HIJAB -->
```

---

## Lampiran B — Prompt Peluncur Sesi

> Untuk eksekusi berurutan gunakan prompt di `prompting-struktur.txt`. Prompt di bawah ini untuk sesi lepas di luar urutan itu.

Tempel teks ini di awal **setiap** sesi baru, termasuk setelah berganti akun atau model:

```text
Kamu melanjutkan proyek Hairy Hijab (Next.js + Supabase) sebagai engineer. Kamu tidak punya riwayat
percakapan sebelumnya; semua konteks ada di repository.

1. Baca AGENTS.md, lalu docs/PROJECT_PLAN.md bagian §0 (Protokol Agent) dan §1 (STATUS SAAT INI),
   lalu 5 entri terakhir di Lampiran D (Handoff Log).
2. Jalankan git status dan gate G2 (§0.7). Jika gagal sebelum kamu mengubah apa pun, perbaiki dulu dan catat.
3. Kerjakan task di "Task berikutnya" (jika ada entri WIP, lanjutkan dari "Langkah berikutnya"-nya).
   Baca hanya bagian dokumen yang ditunjuk task dan peta §0.4.
4. Jangan menebak, jangan menambah scope, jangan menambah dependensi di luar whitelist,
   jangan menampilkan atau menyentuh secret.
5. Sebelum sesi berakhir (atau jika kuota hampir habis): jalankan gate, centang hanya task yang benar-benar
   selesai, perbarui §1, tambahkan entri Lampiran D (status WIP bila belum selesai), lalu commit.

Mulai sekarang. Laporkan singkat isi STATUS SAAT INI dan task yang akan kamu kerjakan.
```

---

## Lampiran C — Template entri Handoff Log

```markdown
### [YYYY-MM-DD HH:MM] — <nama agent/model> — <SELESAI | WIP | BLOCKED>
- Task: P?-?? (sub-langkah selesai: a, b)
- Ringkasan: <apa yang dikerjakan, 2–4 kalimat>
- File dibuat/diubah: <daftar>
- Gate: G1 ✔/✘ · G2 ✔/✘ · G3 ✔/✘ (ringkasan hasil tes: …)
- Commit: <hash> atau BELUM DIKOMIT (daftar file)
- Asumsi / keputusan baru: <… (tambahkan juga ke §4 bila berdampak)>
- Masalah / utang teknis: <… (beri ID TODO bila ada)>
- Langkah berikutnya: <konkret: nama file + fungsi/komponen>
```

---

## Lampiran D — Handoff Log (append-only: tambahkan entri baru di bawah, jangan menghapus entri lama)

### [2026-10-20] — Penyusun Edisi 2.0 — SELESAI
- Task: revisi dokumen (bukan task kode)
- Ringkasan: Rancangan 1.0 di-cross-check terhadap screenshot repository dan dokumentasi terbaru Next.js 16 dan Supabase. 22 temuan (§3.3) diperbaiki; keputusan yang menggantung diputuskan di §4; skema database ditulis lengkap dengan SQL, RLS, dan GRANT dan sudah dijalankan serta diuji pada PostgreSQL 16 (lihat catatan di §11); pekerjaan dipecah menjadi 75 task bertahap (§15) dengan kriteria selesai.
- File dibuat/diubah: dokumen ini.
- Gate: tidak berlaku (belum ada kode).
- Commit: —
- Asumsi / keputusan baru: D-06, D-09, D-10, D-11, D-25 berstatus DEFAULT dan menunggu konfirmasi pemilik (§19).
- Masalah / utang teknis: Tailwind tampaknya belum terpasang (tidak ada `postcss.config.mjs` pada screenshot) — diverifikasi di P0-01.
- Langkah berikutnya: kerjakan **P0-01** (audit lingkungan), lalu P0-02 dan seterusnya sesuai §1.

### [2026-10-20] — Penyusun Edisi 2.0 (tambahan) — SELESAI
- Task: pelengkap dokumen (bukan task kode)
- Ringkasan: Menambah §0.11 dan Lampiran E (Ledger Prompt) serta berkas pendamping `prompting-struktur.txt` (53 prompt, 5 langkah pemilik) agar kegagalan per prompt tercatat. Koreksi: tanggal revisi menjadi 20 Oktober 2026; P6-05 kini menerima klien Supabase sebagai argumen agar sesuai daftar izin admin client §10.5.
- File dibuat/diubah: dokumen ini, `prompting-struktur.txt`.
- Gate: tidak berlaku.
- Commit: —
- Asumsi / keputusan baru: awalan `/1allclear` boleh juga ditulis `1allclear` atau `[1allclear]` (lihat §0.11).
- Masalah / utang teknis: —
- Langkah berikutnya: kirim **Prompt 01** dari `prompting-struktur.txt`.

### [2026-10-21 11:14] — Claude Opus 4.6 (Thinking) — SELESAI
- Task: P0-01 (Audit lingkungan)
- Ringkasan: Mengaudit lingkungan repo dari fakta nyata (`package.json`, `node -v`, `npm -v`, `git`, struktur folder). Mengisi tabel §3.1 dengan nilai terverifikasi. Menemukan dua selisih utama dengan asumsi plan: (1) Tailwind **sudah terpasang** v4.3.3 via `@tailwindcss/turbopack`, bukan belum ada; (2) Next.js 16.4.2 sesuai plan, `proxy.ts` adalah pendekatan yang benar. Tidak ada `src/` — sesuai plan.
- File dibuat/diubah: `Project_Plan_Hairy_Hijab_v2.md` (§1, §3.1, §15 checkbox P0-01, Lampiran D, Lampiran E)
- Gate: tidak berlaku (audit saja, tidak ada perubahan kode). `git status` menunjukkan hanya dokumen plan yang berubah.
- Commit: (setelah semua edit selesai)
- Asumsi / keputusan baru: Tailwind v4 sudah ada melalui `@tailwindcss/turbopack` (konfigurasi Turbopack di `next.config.ts`). Plan §3.1 dan P0-03 mengasumsikan Tailwind belum terpasang dan memerlukan `@tailwindcss/postcss` + `postcss.config.mjs`. P0-03 perlu disesuaikan: mungkin hanya verifikasi, atau menambah `@tailwindcss/postcss` + `postcss` jika `next build` (tanpa Turbopack) memerlukannya. Dicatat juga di §3.1 observasi tabel.
- Masalah / utang teknis: (1) Plan menyebut `postcss.config.mjs` + `@tailwindcss/postcss` untuk Tailwind, tapi scaffold `create-next-app` Next.js 16 menggunakan `@tailwindcss/turbopack` di `next.config.ts`; P0-03 harus memverifikasi apakah `next build` masih memerlukan PostCSS atau cukup Turbopack. (2) Handoff Log lama menyebut "Tailwind tampaknya belum terpasang" — sudah dikoreksi di §3.1 observasi.
- Langkah berikutnya: kerjakan **P0-06** (AGENTS.md, CLAUDE.md, lokasi plan) sesuai prompt 02.

### [2026-10-21 11:23] — Claude Opus 4.6 (Thinking) — SELESAI
- Task: P0-06 (AGENTS.md, CLAUDE.md, lokasi plan)
- Ringkasan: (1) Menambahkan blok Lampiran A (Hairy Hijab project rules) di bawah isi bawaan `AGENTS.md` — isi bawaan Next.js tetap utuh. (2) Membuat `CLAUDE.md` berisi satu baris `@AGENTS.md`. (3) Memindahkan `Project_Plan_Hairy_Hijab_v2.md` ke `docs/PROJECT_PLAN.md` via `git mv`; file lama sudah tidak ada. (4) Menandai prompt 01 sebagai DISETUJUI di Lampiran E. Percobaan 1 gagal karena API quota reached sebelum commit; percobaan 2 melanjutkan dan commit berhasil.
- File dibuat/diubah: `AGENTS.md` (diubah), `CLAUDE.md` (baru), `docs/PROJECT_PLAN.md` (dipindah dari root + diubah §1, §15, Lampiran D, Lampiran E)
- Gate: tidak berlaku (tidak ada perubahan kode). `git status` hanya menunjukkan file dokumen.
- Commit: `chore(P0-06): AGENTS.md, CLAUDE.md, pindah plan ke docs/`
- Asumsi / keputusan baru: —
- Masalah / utang teknis: —
- Langkah berikutnya: kerjakan **P0-02** (bersihkan scaffold) dan **P0-03** (Tailwind CSS) sesuai prompt 03.

### [2026-10-21 14:45] — Claude Opus 4.6 (Thinking) — SELESAI
- Task: P0-02 (Bersihkan scaffold), P0-03 (Tailwind CSS)
- Ringkasan: Melanjutkan pekerjaan agen sebelumnya yang terputus paksa (quota reached) saat proses linting. Kode P0-02 (page.tsx placeholder, layout.tsx lang="id" + metadata, hapus 5 aset SVG template di public/) sudah benar dari sesi sebelumnya. P0-03: Tailwind v4.3.3 sudah terpasang via `@tailwindcss/turbopack`; kelas utilitas terbukti bekerja pada placeholder (flex, text-4xl, font-bold, dll.); hanya verifikasi, tidak ada instalasi baru. Build sudah sukses di sesi sebelumnya.
- File dibuat/diubah: `app/page.tsx` (diubah sesi lalu), `app/layout.tsx` (diubah sesi lalu), `public/file.svg` `public/globe.svg` `public/next.svg` `public/vercel.svg` `public/window.svg` (dihapus sesi lalu), `docs/PROJECT_PLAN.md` (diperbarui §1, §15, Lampiran D, Lampiran E)
- Gate: `npm run lint` ✔ · `npx tsc --noEmit` ✔ · `npm run build` ✔ (sesi sebelumnya)
- Commit: (lihat commit message di bawah)
- Asumsi / keputusan baru: P0-03 hanya berupa verifikasi karena Tailwind sudah terpasang (dicatat di §3.1 dan Handoff Log P0-01). Tidak perlu `@tailwindcss/postcss` + `postcss.config.mjs` karena Next.js 16 menggunakan Turbopack secara default dan `next build` juga mendukung `@tailwindcss/turbopack`.
- Masalah / utang teknis: —
- Langkah berikutnya: kerjakan **P0-04** (Dependensi inti) dan **P0-07** (Script dan gate) sesuai prompt 04.

### [2026-10-21 15:00] — Claude Opus 4.6 (Thinking) — SELESAI
- Task: P0-04 (Dependensi inti), P0-07 (Script dan gate)
- Ringkasan: Melanjutkan pekerjaan agen sebelumnya yang terputus paksa (quota reached) saat npm install. Dependensi belum terinstal sama sekali (package.json masih scaffold asli). Instalasi runtime deps (12 paket) dan dev deps (9 paket) berhasil dengan `--legacy-peer-deps` karena conflict peerOptional `effect` antara `@hookform/resolvers@6` dan `@typeschema/effect`. Menambahkan scripts: `typecheck`, `test`, `test:rls`, `test:e2e`, `db:types`. Membuat `.nvmrc` (24) dan menambahkan `engines.node >=20.9.0` di package.json.
- File dibuat/diubah: `package.json` (diubah: dependencies, devDependencies, scripts, engines), `package-lock.json` (diperbarui npm), `.nvmrc` (baru), `docs/PROJECT_PLAN.md` (diperbarui §1, §15, Lampiran D, Lampiran E)
- Gate: `npm run lint` ✔ · `npm run typecheck` ✔ · `npm run build` ✔ (G2 lulus)
- Commit: `chore(P0-04, P0-07): dependensi inti dan script gate`
- Asumsi / keputusan baru: `--legacy-peer-deps` digunakan karena `@hookform/resolvers@6` mempunyai peerOptional `effect@^4.0.0` yang conflict dengan `effect@3.22.3` yang diinstal oleh resolusi `@typeschema`. Ini peerOptional, bukan hard dependency, sehingga tidak berdampak pada fungsi. Dicatat untuk ditinjau saat upgrade.
- npm audit: 5 high severity — semua dari `braces` (stack-exhaustion DoS) via rantai `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. Fix memerlukan downgrade `eslint-config-next` ke 14.x (breaking change). TIDAK dijalankan `npm audit fix --force`. Risiko rendah (DoS via pola regex sangat dalam, bukan eksploitasi jarak jauh pada aplikasi web).
- Masalah / utang teknis: (1) `--legacy-peer-deps` — pantau saat upgrade `@hookform/resolvers` atau `effect`. (2) `braces` vulnerability — menunggu fix upstream dari Next.js/eslint-config-next.
- Langkah berikutnya: kerjakan **P0-05** (Struktur dasar, env, utilitas) sesuai prompt 05.

### [2026-10-21 15:40] — Claude Opus 4.6 (Thinking) — SELESAI
- Task: P0-05 (Struktur dasar, env, utilitas)
- Ringkasan: Percobaan 2 (percobaan 1 gagal karena API Quota Reached saat membaca dokumen, belum ada file diubah). Semua sub-task selesai: (a) alias `@/*` sudah ada di tsconfig; (b) `.env.example` dibuat sesuai §10.7, `.gitignore` diperbarui agar mengecualikan `.env.example` dari ignore; (c) `lib/env.ts` dengan Zod 4 — validasi eager untuk variabel publik, lazy untuk variabel server; (d) `lib/utils/cn.ts` (clsx + twMerge), `format.ts` (formatRupiah, formatDateID, formatDateTimeID — timezone Asia/Jakarta), `slug.ts` (slugify NFD + strip diacritics), `phone.ts` (normalizePhoneID + buildWhatsAppLink sesuai §14.3); (e) `types/action.ts` (ActionResult §10.4), `config/site.ts`, `config/regions.ts` (38 provinsi Indonesia, sumber Kemendagri/BPS), `config/order-status.ts` (label §9.3–9.4).
- File dibuat/diubah: `.env.example` (baru), `.gitignore` (diubah: +`!.env.example`), `lib/env.ts` (baru), `lib/utils/cn.ts` (baru), `lib/utils/format.ts` (baru), `lib/utils/slug.ts` (baru), `lib/utils/phone.ts` (baru), `types/action.ts` (baru), `config/site.ts` (baru), `config/regions.ts` (baru), `config/order-status.ts` (baru), `docs/PROJECT_PLAN.md` (diperbarui §1, §15, Lampiran D, Lampiran E)
- Gate: `npm run lint` ✔ · `npm run typecheck` ✔
- Commit: `feat(P0-05): struktur dasar, env, utilitas`
- Asumsi / keputusan baru: Zod 4 (`z.url()`) mengembalikan string (bukan `URL` object) — diverifikasi langsung, cocok dengan kebutuhan env validation. `formatRupiah` menghasilkan "Rp125.000" (tanpa spasi antara Rp dan angka — perilaku bawaan `Intl.NumberFormat` id-ID); jika diperlukan spasi, dapat disesuaikan nanti.
- Masalah / utang teknis: —
- Langkah berikutnya: kerjakan **P0-08** (Vitest dan Playwright — tes unit untuk utils) sesuai prompt 06.

---

## Lampiran E — Ledger Prompt (diperbarui agent; menunjukkan alur mana yang sering gagal)

Sumber prompt: `prompting-struktur.txt` (pemilik menyalin prompt berurutan dari sana). Aturan lengkap: §0.11.

**Status:** `BELUM` (belum dikirim) · `MENUNGGU` (agent selesai, menunggu pemilik) · `DISETUJUI` (pemilik mengirim `/1allclear`) · `GAGAL` (pemilik menolak; percobaan ulang) · `WIP` (terhenti di tengah).

**Aturan pengisian:** satu baris per prompt, diperbarui di tempat. Agent hanya boleh menulis `MENUNGGU`, `GAGAL`, atau `WIP`; `DISETUJUI` hanya ditulis setelah pemilik mengawali prompt berikutnya dengan `/1allclear` (atau memakai Prompt Persetujuan). Kolom *Percobaan* naik setiap kali prompt diulang atau diperbaiki.

| Prompt | Fase | Task | Percobaan | Status | Tanggal | Agent/Model | Ringkasan hasil / alasan gagal |
|---|:-:|---|---:|---|---|---|---|
| 01 | 0 | P0-01 | 1 | DISETUJUI | 2026-10-21 | Claude Opus 4.6 (Thinking) | Tabel §3.1 terisi dari fakta. Node 24.21.0 ≥ 20.9 ✔. Next.js 16.4.2 ✔. Tailwind 4.3.3 sudah ada (selisih: via Turbopack, bukan PostCSS). Semua kriteria LULUS. |
| 02 | 0 | P0-06 | 2 | DISETUJUI | 2026-10-21 | Claude Opus 4.6 (Thinking) | Percobaan 1 gagal (quota reached sebelum commit). Percobaan 2: melanjutkan, commit berhasil. AGENTS.md ✔, CLAUDE.md ✔, docs/PROJECT_PLAN.md ✔. Semua kriteria LULUS. |
| 03 | 0 | P0-02, P0-03 | 2 | DISETUJUI | 2026-10-21 | Claude Opus 4.6 (Thinking) | Percobaan 1 gagal (API Quota Reached saat proses linting). Percobaan 2: melanjutkan kode dari sesi sebelumnya, gate lulus, plan diperbarui. P0-02 ✔ (placeholder, lang="id", aset dihapus). P0-03 ✔ (Tailwind v4.3.3 sudah ada, hanya verifikasi). Semua kriteria LULUS. |
| 04 | 0 | P0-04, P0-07 | 2 | DISETUJUI | 2026-10-21 | Claude Opus 4.6 (Thinking) | Percobaan 1 gagal (API Quota Reached saat npm install). Percobaan 2: melanjutkan dari awal (dependensi belum terinstal). Runtime + dev deps terpasang (--legacy-peer-deps karena peerOptional effect conflict). Scripts ditambahkan (typecheck, test, test:rls, test:e2e, db:types). .nvmrc + engines ≥20.9. npm audit: 5 high (braces via eslint-config-next, upstream). Gate G2 lulus. Semua kriteria P0-04 ✔, P0-07 ✔. |
| 05 | 0 | P0-05 | 2 | MENUNGGU | 2026-10-21 | Claude Opus 4.6 (Thinking) | Percobaan 1 gagal (API Quota Reached saat membaca dokumen). Percobaan 2: semua sub-task selesai. Alias @/* ✔. .env.example ✔. .gitignore ✔. lib/env.ts (Zod 4) ✔. lib/utils/{cn,format,slug,phone}.ts ✔. types/action.ts ✔. config/{site,regions,order-status}.ts ✔. npx tsc --noEmit ✔. git check-ignore .env.local ✔. Tidak ada secret di file. Semua kriteria LULUS. |
| 06 | 0 | P0-08 | 0 | BELUM | | | |
| 07 | 1 | P1-01, P1-02 | 0 | BELUM | | | |
| 08 | 1 | P1-03 | 0 | BELUM | | | |
| 09 | 1 | P1-04 | 0 | BELUM | | | |
| 10 | 1 | P1-05 | 0 | BELUM | | | |
| 11 | 2 | P2-00, P2-01 | 0 | BELUM | | | |
| 12 | 2 | P2-02, P2-03 | 0 | BELUM | | | |
| 13 | 2 | P2-04, P2-05 | 0 | BELUM | | | |
| 14 | 2 | P2-06 | 0 | BELUM | | | |
| 15 | 2 | P2-07 | 0 | BELUM | | | |
| 16 | 2 | P2-08, P2-09, P2-10 | 0 | BELUM | | | |
| 17 | 2 | P2-11 | 0 | BELUM | | | |
| 18 | 2 | P2-12 | 0 | BELUM | | | |
| 19 | 3 | P3-01, P3-02 | 0 | BELUM | | | |
| 20 | 3 | P3-03 | 0 | BELUM | | | |
| 21 | 3 | P3-04 | 0 | BELUM | | | |
| 22 | 4 | P3-05, P4-01 | 0 | BELUM | | | |
| 23 | 4 | P4-02 | 0 | BELUM | | | |
| 24 | 4 | P4-03 | 0 | BELUM | | | |
| 25 | 4 | P4-04 | 0 | BELUM | | | |
| 26 | 5 | P5-01, P5-02 | 0 | BELUM | | | |
| 27 | 5 | P5-03 | 0 | BELUM | | | |
| 28 | 6 | P6-01, P6-02, P6-03 | 0 | BELUM | | | |
| 29 | 6 | P6-04 | 0 | BELUM | | | |
| 30 | 6 | P6-05 | 0 | BELUM | | | |
| 31 | 6 | P6-06 | 0 | BELUM | | | |
| 32 | 6 | P6-07, P6-08 | 0 | BELUM | | | |
| 33 | 7 | P7-01 | 0 | BELUM | | | |
| 34 | 7 | P7-02, P7-03 | 0 | BELUM | | | |
| 35 | 8 | P8-01, P8-02 | 0 | BELUM | | | |
| 36 | 8 | P8-03 | 0 | BELUM | | | |
| 37 | 8 | P8-04 | 0 | BELUM | | | |
| 38 | 8 | P8-05 | 0 | BELUM | | | |
| 39 | 8 | P8-06 | 0 | BELUM | | | |
| 40 | 8 | P8-07 | 0 | BELUM | | | |
| 41 | 8 | P8-08 | 0 | BELUM | | | |
| 42 | 8 | P8-09, P8-10 | 0 | BELUM | | | |
| 43 | 9 | P9-01 | 0 | BELUM | | | |
| 44 | 9 | P9-02 | 0 | BELUM | | | |
| 45 | 9 | P9-03, P9-04 | 0 | BELUM | | | |
| 46 | 10 | P10-01, P10-02 | 0 | BELUM | | | |
| 47 | 10 | P10-03 | 0 | BELUM | | | |
| 48 | 10 | P10-04 | 0 | BELUM | | | |
| 49 | 10 | P10-05, P10-06 | 0 | BELUM | | | |
| 50 | 11 | P11-01 | 0 | BELUM | | | |
| 51 | 11 | P11-02 | 0 | BELUM | | | |
| 52 | 11 | P11-02, P11-03, P11-04 | 0 | BELUM | | | |
| 53 | 11 | P11-05, P11-06 | 0 | BELUM | | | |

### Riwayat percobaan (append-only)

Format satu baris: `- P07 #2 [2026-10-21] GAGAL — alasan singkat dan akar masalah (kode / plan / lingkungan)`. Percobaan ke-3 atau lebih wajib memuat analisis akar masalah dan usul perbaikan teks plan sebelum kode diubah.

*(belum ada)*
- P02 #1 [2026-10-21] GAGAL — API Quota Reached sebelum commit. Semua file sudah diubah/dibuat (AGENTS.md, CLAUDE.md, git mv plan) tapi sesi terputus paksa sebelum `git commit`. Penyebab: lingkungan (kuota model habis).
- P03 #1 [2026-10-21] GAGAL — API Quota Reached saat proses linting. Kode P0-02 dan P0-03 sudah selesai dan build sukses, tapi sesi terputus sebelum lint selesai dan plan belum diperbarui. Penyebab: lingkungan (kuota model habis).
- P04 #1 [2026-10-21] GAGAL — API Quota Reached saat npm install dependensi runtime. Agen terputus paksa sebelum dependensi terinstal dan sebelum plan diperbarui (Lampiran E masih BELUM). Penyebab: lingkungan (kuota model habis).
- P05 #1 [2026-10-21] GAGAL — API Quota Reached saat membaca dokumen. Agen terputus paksa sebelum ada file kode yang diubah. Penyebab: lingkungan (kuota model habis).
