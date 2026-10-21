<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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
