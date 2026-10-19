(() => {
  'use strict';

  const CFG = window.PORTAL_CONFIG || {};
  const SSO = window.GiziSSO;
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
    'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const $ = (id) => document.getElementById(id);
  const param = new URLSearchParams(location.search);
  const kembali = param.get('kembali');
  let mode = param.get('mode') === 'staf' ? 'staf' : 'mahasiswa';

  isiPilihanTanggal();
  document.querySelectorAll('.seg [data-mode]').forEach((b) => b.addEventListener('click', () => pilihMode(b.dataset.mode)));
  pilihMode(mode);
  $('form-masuk').addEventListener('submit', onMasuk);
  $('btn-keluar').addEventListener('click', () => { SSO.keluar(false); tampil('masuk'); });

  mulai();

  async function mulai() {
    if (!CFG.API_URL) { tampil(null); $('belum-siap').hidden = false; return; }
    const s = SSO.sesi();
    if (!s) return tampil('masuk');
    await bukaDasbor(s);
  }

  // ---------- Login ----------
  function isiPilihanTanggal() {
    const opsi = (el, label, items) => {
      el.innerHTML = `<option value="">${label}</option>` +
        items.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
    };
    const tahunIni = new Date().getFullYear();
    opsi($('tgl-hari'), 'Tgl', Array.from({ length: 31 }, (_, i) => [pad(i + 1), i + 1]));
    opsi($('tgl-bulan'), 'Bulan', BULAN.map((b, i) => [pad(i + 1), b]));
    const tahun = [];
    for (let y = tahunIni - 15; y >= tahunIni - 60; y--) tahun.push([y, y]);
    opsi($('tgl-tahun'), 'Tahun', tahun);
  }

  function rapikanNim(v) {
    let s = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (/^P0\d/.test(s)) s = 'PO' + s.slice(2);
    return s;
  }

  function pilihMode(m) {
    mode = m;
    document.querySelectorAll('.seg [data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
    $('isian-mhs').hidden = m !== 'mahasiswa';
    $('isian-staf').hidden = m !== 'staf';
    $('bantu-masuk').textContent = m === 'staf'
      ? 'Untuk dosen, PLP, dan admin. Login berlaku 12 jam. PIN diatur oleh admin jurusan.'
      : 'Gunakan NIM dan tanggal lahir sesuai data akademik. Login berlaku 7 hari di perangkat ini.';
    pesan('');
  }

  async function onMasuk(e) {
    e.preventDefault();
    pesan('');
    if (mode === 'staf') return onMasukStaf();
    const nim = rapikanNim($('nim').value);
    const d = $('tgl-hari').value, m = $('tgl-bulan').value, y = $('tgl-tahun').value;
    if (nim.length < 8) return pesan('Isi NIM dengan benar. Contoh: PO714231264002');
    if (!d || !m || !y) return pesan('Lengkapi tanggal, bulan, dan tahun lahir.');

    const btn = $('btn-masuk');
    sibuk(btn, true, 'Memeriksa…');
    try {
      const res = await api({ aksi: 'login', nim, tgl: `${y}-${m}-${d}` });
      if (!res.ok) return pesan(res.pesan || 'NIM atau tanggal lahir tidak cocok.');
      SSO.simpan(res.token);
      $('form-masuk').reset();
      await bukaDasbor(SSO.get());
    } catch (err) {
      pesan(navigator.onLine ? 'Server tidak merespons. Coba lagi sebentar lagi.' : 'Tidak ada koneksi internet.');
    } finally {
      sibuk(btn, false, 'Masuk');
    }
  }

  async function onMasukStaf() {
    const id = $('staf-id').value.trim();
    const pin = $('staf-pin').value.trim();
    if (!id || !pin) return pesan('Isi NIP/ID dan PIN.');
    const btn = $('btn-masuk');
    sibuk(btn, true, 'Memeriksa…');
    try {
      const res = await api({ aksi: 'login', mode: 'staf', id, pin });
      if (!res.ok) return pesan(res.pesan || 'NIP/ID atau PIN salah.');
      SSO.simpan(res.token);
      $('form-masuk').reset();
      await bukaDasbor(SSO.sesi());
    } catch (err) {
      pesan(navigator.onLine ? 'Server tidak merespons. Coba lagi sebentar lagi.' : 'Tidak ada koneksi internet.');
    } finally {
      sibuk(btn, false, 'Masuk');
    }
  }

  // ---------- Dashboard ----------
  async function bukaDasbor(s) {
    tampil(null);
    let res;
    try {
      res = await api({ aksi: 'aplikasi', token: s.token });
    } catch (err) {
      // Server tak terjangkau: tetap tampilkan profil, daftar layanan menyusul.
      res = { ok: true, aplikasi: [], gagal: true };
    }
    if (!res.ok) { SSO.keluar(false); pilihMode(s.jenis === 'staf' ? 'staf' : 'mahasiswa'); tampil('masuk'); return pesan(res.pesan || 'Silakan masuk lagi.'); }

    const apps = res.aplikasi || [];
    const tujuan = alamatKembali(apps);
    if (tujuan) { location.replace(denganToken(tujuan, s.token, true)); return; }

    const namaDepan = String(s.nama || '').split(/[\s,]+/)[0] || 'Mahasiswa';
    $('salam').textContent = salamWaktu() + ',';
    $('mhs-nama').textContent = s.nama || '-';
    if (s.jenis === 'staf') {
      const peran = [s.jabatan || '', s.esidang === 'admin' ? 'Admin e-Sidang' : s.esidang === 'dosen' ? 'Dosen' : '', s.silab ? 'SILAB' : ''].filter(Boolean);
      $('mhs-info').textContent = ['Dosen / Staf', s.id].concat(peran).join(' · ');
    } else {
      $('mhs-info').textContent = [s.nim, s.prodi, s.kelas].filter(Boolean).join(' · ');
    }
    $('avatar').textContent = inisial(s.nama || namaDepan);

    const ul = $('daftar-app');
    ul.innerHTML = '';
    apps.forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'app';
      link.href = denganToken(a.url, s.token, a.sso);
      link.style.setProperty('--warna', a.warna);
      link.innerHTML = `
        <span class="app-ikon" aria-hidden="true"></span>
        <span class="app-teks">
          <span class="app-nama"></span>
          <span class="app-desk"></span>
        </span>
        <span class="app-tanda"></span>`;
      link.querySelector('.app-ikon').textContent = a.ikon;
      link.querySelector('.app-nama').textContent = a.nama;
      link.querySelector('.app-desk').textContent = a.deskripsi || '';
      link.querySelector('.app-tanda').textContent = a.sso ? 'Langsung masuk' : 'Login terpisah';
      link.querySelector('.app-tanda').classList.toggle('lain', !a.sso);
      li.appendChild(link);
      ul.appendChild(li);
      if (a.badge) muatBadge(a.badge, s.token, link.querySelector('.app-tanda'));
    });
    $('app-kosong').hidden = apps.length > 0;
    if (res.gagal) { $('app-kosong').hidden = false; $('app-kosong').textContent = 'Daftar layanan gagal dimuat. Periksa koneksi lalu muat ulang halaman.'; }
    tampil('dasbor');
  }

  /** Angka pemberitahuan di kotak aplikasi (mis. "3 baru"), diambil dari server aplikasinya. */
  async function muatBadge(url, token, el) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ aksi: 'badge', token }) });
      const d = await r.json();
      if (d && d.ok && Number(d.jumlah) > 0) {
        el.textContent = `${Number(d.jumlah)} ${d.label || 'baru'}`;
        el.classList.remove('lain');
        el.classList.add('baru');
      }
    } catch (e) { /* abaikan: badge hanya pelengkap */ }
  }

  /** Alamat ?kembali= hanya diikuti bila menuju domain ini atau aplikasi terdaftar. */
  function alamatKembali(apps) {
    if (!kembali) return null;
    try {
      const u = new URL(kembali);
      if (u.origin === location.origin) return u.href;
      return apps.some((a) => u.href.indexOf(a.url) === 0) ? u.href : null;
    } catch (e) { return null; }
  }

  /** Aplikasi di domain lain menerima token lewat #sso=; domain sama cukup localStorage. */
  function denganToken(url, token, sso) {
    try {
      const u = new URL(url, location.href);
      if (!sso || u.origin === location.origin) return u.href;
      u.hash = (u.hash ? u.hash.slice(1) + '&' : '') + 'sso=' + encodeURIComponent(token);
      return u.href;
    } catch (e) { return url; }
  }

  // ---------- API ----------
  async function api(data) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    try {
      const r = await fetch(CFG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
        signal: ctrl.signal,
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally {
      clearTimeout(t);
    }
  }

  // ---------- Utilitas ----------
  function tampil(layar) {
    $('layar-muat').hidden = layar !== null;
    $('layar-masuk').hidden = layar !== 'masuk';
    $('layar-dasbor').hidden = layar !== 'dasbor';
    if (layar === 'masuk') setTimeout(() => $(mode === 'staf' ? 'staf-id' : 'nim').focus(), 50);
  }
  function pesan(t) { const p = $('pesan'); p.textContent = t; p.hidden = !t; if (t) tampil('masuk'); }
  function sibuk(btn, ya, label) { btn.disabled = ya; btn.innerHTML = ya ? `<span class="putar kecil"></span>${label}` : label; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function inisial(n) {
    return String(n).replace(/[^A-Za-z ]/g, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  }
  function salamWaktu() {
    const j = new Date().getHours();
    return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 19 ? 'Selamat sore' : 'Selamat malam';
  }
})();
