(() => {
  'use strict';

  const CFG = window.APP_CONFIG || {};
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
    'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const $ = (id) => document.getElementById(id);

  // Kredensial hanya disimpan di memori (bukan localStorage) — aman di HP pinjaman.
  let sesi = null;      // { nim, tgl } atau { nim, token } bila lewat Gizi-Link
  const SSO = window.GiziSSO || null;
  let urlPdf = null;

  // ---------- Inisialisasi ----------
  document.title = CFG.NAMA_APLIKASI || document.title;
  $('judul-app').textContent = CFG.NAMA_APLIKASI || 'Cari Surat Mahasiswa';
  $('nama-instansi').textContent = CFG.NAMA_INSTANSI || '';
  $('kontak-admin').textContent = CFG.KONTAK_ADMIN || '';

  isiPilihanTanggal();
  aturLayarHp();
  window.addEventListener('resize', aturLayarHp);

  $('form-cari').addEventListener('submit', onCari);
  $('btn-keluar').addEventListener('click', keluar);
  if (SSO) $('btn-gizilink').addEventListener('click', () => SSO.masuk(location.href.split('#')[0]));
  else $('btn-gizilink').hidden = true;
  $('btn-tutup').addEventListener('click', tutupPenampil);
  $('penampil').addEventListener('click', (e) => { if (e.target.id === 'penampil') tutupPenampil(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') tutupPenampil(); });

  window.addEventListener('online', statusKoneksi);
  window.addEventListener('offline', statusKoneksi);
  statusKoneksi();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  masukOtomatis();

  // ---------- Gizi-Link: login sekali ----------
  async function masukOtomatis() {
    const s = SSO && SSO.get();
    if (!s) return;
    $('btn-cari').disabled = true;
    try {
      const res = await panggilApi({ aksi: 'cari', token: s.token });
      if (!res.ok) { tampilPesan(res.pesan || 'Gagal masuk otomatis. Silakan isi NIM & tanggal lahir.'); return; }
      sesi = { nim: rapikanNim(s.nim), token: s.token };
      tampilHasil(res);
    } catch (err) {
      // Server tak terjangkau: biarkan form manual tetap bisa dipakai.
    } finally {
      $('btn-cari').disabled = false;
    }
  }

  // ---------- Form ----------
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

  function nilaiTanggal() {
    const d = $('tgl-hari').value, m = $('tgl-bulan').value, y = $('tgl-tahun').value;
    return d && m && y ? `${y}-${m}-${d}` : '';
  }

  function rapikanNim(v) {
    let s = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (/^P0\d/.test(s)) s = 'PO' + s.slice(2);
    return s;
  }

  async function onCari(e) {
    e.preventDefault();
    sembunyikanPesan();
    const nim = rapikanNim($('nim').value);
    const tgl = nilaiTanggal();

    if (!/^PO\d{12}$/.test(nim)) return tampilPesan('Format NIM belum benar. Contoh: PO714231264002');
    if (!tgl) return tampilPesan('Lengkapi tanggal, bulan, dan tahun lahir.');

    const btn = $('btn-cari');
    sibuk(btn, true, 'Mencari…');
    try {
      const res = await panggilApi({ aksi: 'cari', nim, tgl });
      if (!res.ok) return tampilPesan(res.pesan || 'Data tidak cocok.');
      sesi = { nim, tgl };
      tampilHasil(res);
    } catch (err) {
      tampilPesan(navigator.onLine
        ? 'Server tidak merespons. Coba lagi beberapa saat.'
        : 'Tidak ada koneksi internet.');
    } finally {
      sibuk(btn, false, 'Cari surat saya');
    }
  }

  // ---------- Daftar surat ----------
  function tampilHasil(res) {
    $('mhs-nama').textContent = res.nama || '-';
    $('mhs-info').textContent = [sesi.nim, res.prodi].filter(Boolean).join(' · ');

    const ul = $('daftar-surat');
    ul.innerHTML = '';
    const surat = res.surat || [];
    $('jumlah').textContent = surat.length;
    $('kosong').hidden = surat.length > 0;

    surat.forEach((s) => {
      const li = document.createElement('li');
      li.className = 'surat';
      const jenis = el('span', 'jenis ' + kelasJenis(s.jenis), s.jenis);
      const perihal = el('p', 'perihal', s.perihal || s.jenis);
      const tgl = el('p', 'tanggal', formatTanggal(s.tanggal));
      const btn = el('button', 'btn sekunder', 'Lihat');
      btn.type = 'button';
      btn.addEventListener('click', () => ambilSurat(s, btn));
      li.append(jenis, btn, perihal, tgl);
      ul.appendChild(li);
    });

    $('layar-cari').hidden = true;
    $('layar-hasil').hidden = false;
    window.scrollTo({ top: 0 });
  }

  async function ambilSurat(s, btn) {
    sibuk(btn, true, '');
    try {
      const res = await panggilApi(sesi.token
        ? { aksi: 'unduh', token: sesi.token, id: s.id }
        : { aksi: 'unduh', nim: sesi.nim, tgl: sesi.tgl, id: s.id });
      if (!res.ok) { alert(res.pesan || 'Surat tidak dapat dibuka.'); return; }
      bukaPenampil(res, s);
    } catch (err) {
      alert('Gagal mengambil surat. Periksa koneksi lalu coba lagi.');
    } finally {
      sibuk(btn, false, 'Lihat');
    }
  }

  // ---------- Penampil PDF ----------
  function bukaPenampil(res, s) {
    if (urlPdf) URL.revokeObjectURL(urlPdf);
    const bytes = Uint8Array.from(atob(res.data), (c) => c.charCodeAt(0));
    urlPdf = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));

    $('penampil-judul').textContent = s.perihal || s.jenis;
    $('btn-buka').href = urlPdf;
    $('btn-unduh').href = urlPdf;
    $('btn-unduh').download = res.namaFile || 'surat.pdf';
    if (!document.body.classList.contains('layar-hp')) $('pdf-frame').src = urlPdf;
    $('penampil').hidden = false;
    $('btn-tutup').focus();
  }

  function tutupPenampil() {
    if ($('penampil').hidden) return;
    $('penampil').hidden = true;
    $('pdf-frame').removeAttribute('src');
  }

  function keluar() {
    tutupPenampil();
    if (urlPdf) { URL.revokeObjectURL(urlPdf); urlPdf = null; }
    if (sesi && sesi.token && SSO) SSO.keluar(false);   // keluar juga dari Gizi-Link di perangkat ini
    sesi = null;
    $('form-cari').reset();
    $('daftar-surat').innerHTML = '';
    $('layar-hasil').hidden = true;
    $('layar-cari').hidden = false;
    $('nim').focus();
  }

  // ---------- API ----------
  async function panggilApi(data) {
    // text/plain agar tidak memicu preflight CORS di Apps Script
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
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
  function el(tag, cls, teks) {
    const n = document.createElement(tag);
    n.className = cls;
    n.textContent = teks;
    return n;
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function formatTanggal(iso) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}` : (iso || '');
  }
  function kelasJenis(j) {
    j = String(j).toLowerCase();
    if (j.includes('aktif')) return 'j-aktif';
    if (j.includes('data awal')) return 'j-data';
    if (j.includes('izin')) return 'j-izin';
    if (j.includes('ujian')) return 'j-ujian';
    return '';
  }
  function sibuk(btn, ya, label) {
    btn.disabled = ya;
    btn.innerHTML = ya ? `<span class="putar"></span>${label}` : label;
  }
  function tampilPesan(t) { const p = $('pesan-cari'); p.textContent = t; p.hidden = false; }
  function sembunyikanPesan() { $('pesan-cari').hidden = true; }
  function statusKoneksi() { $('offline').hidden = navigator.onLine; }
  function aturLayarHp() {
    const hp = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 700;
    document.body.classList.toggle('layar-hp', hp);
  }
})();
