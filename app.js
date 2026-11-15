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
  $('btn-keluar').addEventListener('click', () => { SSO.keluar(false); tutupApp(); tutupLaci(); tampil('masuk'); });

  // ----- Tampilan dasbor: menu kiri (laptop) / laci ☰ (HP) -----
  const LEBAR = window.matchMedia('(min-width: 900px)');
  const DI_BINGKAI = window.top !== window.self;   // portal terbuka di dalam panel aplikasi Gizi-Link
  let APPS = [], SESI = null, AKTIF = '';
  const ST = { tab: bacaPilihan('gizilink_tab_prodi') || 'd3', cplPenuh: false };
  $('btn-laci').addEventListener('click', bukaLaci);
  $('btn-tutup-laci').addEventListener('click', tutupLaci);
  $('tirai').addEventListener('click', tutupLaci);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') tutupLaci(); });
  $('bingkai').addEventListener('load', () => { $('muat-app').hidden = true; });
  LEBAR.addEventListener('change', () => { tutupLaci(); if (SESI && !AKTIF) gambarProfil(); });
  // Aplikasi di dalam panel yang "kembali ke Gizi-Link" atau keluar → panel induk menampilkan Beranda / login.
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || !e.data.gizilink) return;
    if (!SSO.sesi()) { tutupApp(); tutupLaci(); return tampil('masuk'); }
    tampilBeranda();
  });

  mulai();

  async function mulai() {
    if (!CFG.API_URL) { tampil(null); $('belum-siap').hidden = false; return; }
    const s = SSO.sesi();
    if (DI_BINGKAI && (!s || !kembali)) {
      // Jangan menumpuk portal di dalam portal: serahkan ke halaman induk.
      try { window.parent.postMessage({ gizilink: s ? 'beranda' : 'keluar' }, location.origin); } catch (e) { }
      tampil(null);
      return;
    }
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

    APPS = apps; SESI = s;
    const namaDepan = String(s.nama || '').split(/[\s,]+/)[0] || 'Mahasiswa';
    let info;
    if (s.jenis === 'staf') {
      const peran = [s.jabatan || '', s.esidang === 'admin' ? 'Admin e-Sidang' : s.esidang === 'dosen' ? 'Dosen' : '', s.silab ? 'SILAB' : ''].filter(Boolean);
      info = ['Dosen / Staf', s.id].concat(peran).join(' · ');
    } else {
      info = [s.nim, s.prodi, s.kelas].filter(Boolean).join(' · ');
    }
    $('salam').textContent = salamWaktu() + ',';
    ['mhs-nama', 'nama-hp'].forEach((id) => { $(id).textContent = s.nama || '-'; });
    ['mhs-info', 'info-hp'].forEach((id) => { $(id).textContent = info; });
    ['avatar', 'avatar-hp'].forEach((id) => { $(id).textContent = inisial(s.nama || namaDepan); });
    $('sapa').textContent = `${salamWaktu()}, ${namaDepan} 👋`;
    $('sapa-sub').textContent = s.jenis === 'staf'
      ? 'Visi, misi, profil lulusan, dan CPL ketiga program studi Jurusan Gizi.'
      : 'Kenali arah program studimu: visi, misi, profil lulusan, dan capaian pembelajaran.';

    // Kartu layanan (tampil di HP)
    const ul = $('daftar-app');
    ul.innerHTML = '';
    apps.forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'app';
      link.href = denganToken(a.url, s.token, a.sso);
      if (!seAsal(a.url)) { link.target = '_blank'; link.rel = 'noopener'; }
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
      link.addEventListener('click', (e) => pilihApp(a, e));
      li.appendChild(link);
      ul.appendChild(li);
      if (a.badge) muatBadge(a.badge, s.token, link.querySelector('.app-tanda'), a.id);
    });
    $('app-kosong').hidden = apps.length > 0;
    if (res.gagal) { $('app-kosong').hidden = false; $('app-kosong').textContent = 'Daftar layanan gagal dimuat. Periksa koneksi lalu muat ulang halaman.'; }

    gambarMenu();
    gambarProfil();
    tampil('dasbor');
    // Buka lagi aplikasi terakhir (alamat #app=...) bila di layar lebar
    const awal = (location.hash.match(/(?:^#|&)app=([^&]+)/) || [])[1];
    const appAwal = awal && apps.find((a) => a.id === decodeURIComponent(awal));
    if (appAwal && LEBAR.matches && seAsal(appAwal.url)) bukaApp(appAwal); else tampilBeranda(true);
  }

  // ---------- Menu kiri / laci ----------
  function seAsal(url) { try { return new URL(url, location.href).origin === location.origin; } catch (e) { return false; } }

  function gambarMenu() {
    const nav = $('menu');
    nav.innerHTML = '';
    const tombol = (a) => {
      const el = document.createElement('a');
      el.className = 'menu-item';
      el.dataset.id = a ? a.id : '';
      el.href = a ? denganToken(a.url, SESI.token, a.sso) : './';
      if (a && !seAsal(a.url)) { el.target = '_blank'; el.rel = 'noopener'; }
      el.innerHTML = '<span class="menu-ikon" aria-hidden="true"></span><span class="menu-nama"></span><span class="menu-tanda" hidden></span>';
      el.querySelector('.menu-ikon').textContent = a ? a.ikon : '🏠';
      el.querySelector('.menu-nama').textContent = a ? a.nama : 'Beranda';
      if (a && !seAsal(a.url)) { const t = el.querySelector('.menu-tanda'); t.hidden = false; t.textContent = '↗'; t.classList.add('luar'); }
      el.addEventListener('click', (e) => pilihApp(a, e));
      return el;
    };
    const judul = (t) => { const h = document.createElement('p'); h.className = 'menu-judul'; h.textContent = t; return h; };
    nav.appendChild(tombol(null));
    const dalam = APPS.filter((a) => seAsal(a.url)), luar = APPS.filter((a) => !seAsal(a.url));
    if (dalam.length) { nav.appendChild(judul('Aplikasi Jurusan')); dalam.forEach((a) => nav.appendChild(tombol(a))); }
    if (luar.length) { nav.appendChild(judul('Aplikasi luar · tab baru')); luar.forEach((a) => nav.appendChild(tombol(a))); }
    tandaiMenu();
  }

  function tandaiMenu() {
    document.querySelectorAll('#menu .menu-item').forEach((el) => {
      if (el.dataset.id === AKTIF) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
    });
  }

  /** Klik menu / kartu: laptop → aplikasi jurusan tampil di panel kanan; HP → halaman penuh; aplikasi luar → tab baru. */
  function pilihApp(a, e) {
    tutupLaci();
    if (!a) { e.preventDefault(); return tampilBeranda(); }
    if (!seAsal(a.url)) return;                 // biarkan tautan membuka tab baru
    if (!LEBAR.matches) return;                 // HP: navigasi biasa (satu layar penuh)
    e.preventDefault();
    bukaApp(a);
  }

  function bukaApp(a) {
    AKTIF = a.id;
    $('beranda').hidden = true;
    $('muat-app').hidden = false;
    const f = $('bingkai');
    f.hidden = false;
    f.title = a.nama;
    f.src = denganToken(a.url, SESI.token, a.sso);
    try { history.replaceState(null, '', '#app=' + encodeURIComponent(a.id)); } catch (e) { }
    tandaiMenu();
  }

  function tutupApp() {
    AKTIF = '';
    const f = $('bingkai');
    if (!f.hidden) { f.hidden = true; f.src = 'about:blank'; }
    $('muat-app').hidden = true;
  }

  function tampilBeranda(tanpaGulir) {
    tutupApp();
    $('beranda').hidden = false;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
    tandaiMenu();
    if (!tanpaGulir) { $('panel').scrollTop = 0; window.scrollTo(0, 0); }
  }

  function bukaLaci() { $('sisi').classList.add('buka'); $('tirai').hidden = false; }
  function tutupLaci() { $('sisi').classList.remove('buka'); $('tirai').hidden = true; }

  // ---------- Beranda: profil program studi ----------
  function bacaPilihan(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function simpanPilihan(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /** "D4 - Gizi dan Dietetika" → d4 · "D3 - Gizi" → d3 · "Prof - ..." → prof */
  function kunciProdi(prodi) {
    const p = String(prodi || '').toLowerCase();
    if (/prof|dietisien/.test(p)) return 'prof';
    if (/d4|d-?iv|sarjana terapan|dietetika/.test(p)) return 'd4';
    if (/d3|d-?iii|diploma/.test(p)) return 'd3';
    return '';
  }

  function gambarProfil() {
    const data = window.PROFIL_PRODI;
    const wadah = $('profil-prodi'), tab = $('tab-prodi');
    if (!data || !SESI) { wadah.innerHTML = ''; tab.hidden = true; $('judul-profil').hidden = true; return; }
    const staf = SESI.jenis === 'staf';
    let k = staf ? ST.tab : kunciProdi(SESI.prodi);
    if (!data.PRODI[k]) k = staf ? 'd3' : '';
    if (!k) { wadah.innerHTML = ''; tab.hidden = true; $('judul-profil').hidden = true; return; }
    // Dosen/staf: tab ketiga prodi
    tab.hidden = !staf;
    if (staf) {
      tab.innerHTML = Object.keys(data.PRODI).map((x) =>
        `<button type="button" data-tab="${x}" aria-pressed="${x === k}">${esc(data.PRODI[x].pendek)}</button>`).join('');
      tab.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
        ST.tab = b.dataset.tab; simpanPilihan('gizilink_tab_prodi', ST.tab); gambarProfil();
      }));
    }
    const p = data.PRODI[k], lebar = LEBAR.matches;
    const unggul = ST.cplPenuh ? data.KEUNGGULAN.lengkap : data.KEUNGGULAN.ringkas;
    wadah.innerHTML = `
      <section class="prodi-hero">
        <h3>${esc(p.nama)}</h3>
        <div class="prodi-chip">${(p.chip || []).map((c) => `<span>${esc(c)}</span>`).join('')}${p.akre ? `<span class="akre">${esc(p.akre)}</span>` : ''}</div>
      </section>
      <details class="bagian" open>
        <summary><span class="bagian-ikon" aria-hidden="true">🎯</span>Visi &amp; Misi</summary>
        <div class="bagian-isi">
          <p class="visi">“${esc(p.visi)}”</p>
          <p class="sub-judul">Misi</p>
          <ol class="misi">${p.misi.map((m) => `<li>${esc(m)}</li>`).join('')}</ol>
        </div>
      </details>
      <details class="bagian" ${lebar ? 'open' : ''}>
        <summary><span class="bagian-ikon" aria-hidden="true">🧑‍⚕️</span>Profil Lulusan <small>(${p.profil.length})</small></summary>
        <div class="bagian-isi"><div class="profil-grid">${p.profil.map((x) => `<div><b>${esc(x[0])}</b><p>${esc(x[1])}</p></div>`).join('')}</div></div>
      </details>
      <details class="bagian" id="bagian-cpl" ${lebar || ST.cplDibuka ? 'open' : ''}>
        <summary><span class="bagian-ikon" aria-hidden="true">📚</span>Capaian Pembelajaran Lulusan (CPL) <small>(${p.cpl.length})</small></summary>
        <div class="bagian-isi">
          <button type="button" class="tombol-cpl" id="btn-cpl">${ST.cplPenuh ? 'Tampilkan ringkas' : 'Tampilkan rumusan lengkap'}</button>
          <ol class="cpl">${p.cpl.map((t) => `<li>${esc(String(t).replace('{K}', unggul))}</li>`).join('')}</ol>
          <p class="sumber">Sumber: ${esc(data.SUMBER_CPL || '')}</p>
        </div>
      </details>`;
    $('judul-profil').hidden = false;
    $('btn-cpl').addEventListener('click', () => { ST.cplPenuh = !ST.cplPenuh; ST.cplDibuka = true; gambarProfil(); });
  }

  /** Angka pemberitahuan di kotak aplikasi (mis. "3 baru"), diambil dari server aplikasinya. */
  async function muatBadge(url, token, el, id) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ aksi: 'badge', token }) });
      const d = await r.json();
      if (d && d.ok && Number(d.jumlah) > 0) {
        el.textContent = `${Number(d.jumlah)} ${d.label || 'baru'}`;
        el.classList.remove('lain');
        el.classList.add('baru');
        const m = document.querySelector(`#menu .menu-item[data-id="${CSS.escape(id || '')}"] .menu-tanda`);
        if (m) { m.hidden = false; m.textContent = el.textContent; m.classList.add('baru'); }
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
    document.body.classList.toggle('mode-dasbor', layar === 'dasbor');
    if (layar === 'masuk' && /(?:^#|&)app=/.test(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { } }
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
