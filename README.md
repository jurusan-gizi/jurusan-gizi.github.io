# Gizi-Link — Kantor Virtual Mahasiswa (Login Sekali)

Portal login sekali (SSO) untuk layanan mahasiswa Jurusan Gizi Poltekkes Kemenkes Makassar.
Mahasiswa masuk **sekali** dengan **NIM + tanggal lahir** di `https://jurusan-gizi.github.io/`,
lalu SILAB Gizi dan e-Sidang Gizi langsung terbuka tanpa login ulang.

## Cara kerja singkat

1. Portal mencocokkan NIM + tanggal lahir dengan sheet **Mahasiswa** (Google Sheet portal).
2. Kalau cocok, portal memberi **token** bertanda tangan digital, berlaku 7 hari, disimpan di browser.
3. Semua aplikasi di `jurusan-gizi.github.io/...` bisa membaca token itu (domain yang sama).
4. Server tiap aplikasi (Apps Script) memeriksa keaslian token dengan **RAHASIA SSO** yang sama,
   jadi token tidak bisa dipalsukan dari browser.

## Isi repository ini

| File | Fungsi |
|---|---|
| `index.html`, `app.js`, `style.css` | Halaman login + dashboard aplikasi |
| `config.js` | **Satu-satunya file yang diisi**: URL Apps Script portal |
| `sso.js` | Pustaka kecil yang dipasang di setiap aplikasi |
| `manifest.webmanifest`, `icons/` | Supaya Gizi-Link bisa di-install di HP |

Nama repository **harus persis** `jurusan-gizi.github.io` supaya alamatnya
`https://jurusan-gizi.github.io/` (tanpa nama folder).

## Menambah aplikasi baru kelak

Cukup tambah **1 baris** di sheet **Aplikasi** (Google Sheet portal) — tidak perlu ubah kode portal:

| kolom | isi |
|---|---|
| urutan | angka urutan tampil (1 = paling atas) |
| id | kode singkat, mis. `kuesioner` |
| nama | nama yang tampil, mis. `e-Kuesioner` |
| deskripsi | 1 kalimat singkat |
| url | alamat aplikasi, mis. `https://jurusan-gizi.github.io/e-kuesioner/` |
| ikon | 1 emoji, mis. `📝` |
| warna | kode warna, mis. `#7C3AED` |
| aktif | `YA` / `TIDAK` (TIDAK = disembunyikan sementara) |
| sso | `YA` kalau aplikasinya sudah memakai `sso.js`, `TIDAK` kalau login sendiri |
| prodi | kosongkan = semua prodi; isi mis. `D3` = hanya mahasiswa yang prodinya mengandung "D3" |

Agar aplikasi baru ikut login sekali:

1. Pasang di `<head>` aplikasi: `<script src="https://jurusan-gizi.github.io/sso.js"></script>`
2. Di JavaScript: `const mhs = GiziSSO.get();` → berisi `nim`, `nama`, `prodi`, `kelas`, `token` (atau `null`).
   Tombol masuk: `GiziSSO.masuk()`. Tombol keluar: `GiziSSO.keluar()`.
3. Kirim `mhs.token` ke Apps Script aplikasi itu, lalu periksa dengan fungsi `verifikasiSSO_(token)`
   (salin dari `Portal.gs`) — jangan pernah percaya NIM yang dikirim browser begitu saja.
4. Isi Script Property `SSO_SECRET` di Apps Script aplikasi itu dengan rahasia yang sama.

## Keamanan

- Tanggal lahir tidak pernah disimpan di browser; yang disimpan hanya token.
- Salah login 5× → NIM dikunci 15 menit.
- **Keluar** di portal menghapus login Gizi-Link dan sesi SILAB di perangkat itu.
- Kalau RAHASIA SSO bocor atau ingin memaksa semua mahasiswa login ulang: jalankan
  `gantiRahasiaSSO` di Apps Script portal, lalu salin rahasia baru ke semua aplikasi.
