/*!
 * Gizi-Link SSO — pustaka kecil untuk semua aplikasi Jurusan Gizi.
 *
 * Pasang di <head> aplikasi (SEBELUM script aplikasi itu sendiri):
 *   <script src="https://jurusan-gizi.github.io/sso.js"></script>
 *
 * Pemakaian:
 *   GiziSSO.get()          → MAHASISWA: { token, nim, nama, prodi, kelas, angkatan, exp } atau null
 *   GiziSSO.getStaf()      → DOSEN/STAF: { token, id, nama, silab, esidang, exp } atau null
 *   GiziSSO.masuk(url, 'staf') → buka portal di tab Dosen/Staf
 *   GiziSSO.masuk()        → buka portal untuk login, lalu kembali ke halaman ini
 *   GiziSSO.keluar()       → keluar dari SEMUA aplikasi di perangkat ini
 *   GiziSSO.wajib()        → sama dengan get(), tapi langsung ke portal kalau belum login
 *
 * Token disimpan di localStorage domain jurusan-gizi.github.io, jadi otomatis
 * terbaca oleh semua aplikasi di domain itu. Untuk aplikasi di domain lain,
 * portal mengirim token lewat alamat (#sso=...) dan pustaka ini menyimpannya.
 * Keaslian token TETAP diperiksa oleh server (Apps Script) masing-masing aplikasi.
 */
(function (w) {
  'use strict';
  var KUNCI = 'gizilink_sso';
  var PORTAL = 'https://jurusan-gizi.github.io/';
  // Sesi lokal aplikasi yang ikut dihapus saat keluar dari Gizi-Link.
  var SESI_APLIKASI = ['silab_sess'];

  function simpanLokal(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function bacaLokal(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function hapusLokal(k) { try { localStorage.removeItem(k); } catch (e) { } }

  function decodeBase64Url(b) {
    b = String(b).replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    var bin = atob(b), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function isiToken(token) {
    try {
      var p = JSON.parse(decodeBase64Url(String(token).split('.')[0]));
      return p && (p.nim || (p.jenis === 'staf' && p.id)) ? p : null;
    } catch (e) { return null; }
  }

  // Tangkap token yang dikirim portal lewat alamat (#sso=...), lalu bersihkan alamat.
  (function tangkapDariAlamat() {
    try {
      var m = location.hash.match(/(?:^#|&)sso=([^&]+)/);
      if (!m) return;
      var token = decodeURIComponent(m[1]);
      if (isiToken(token)) simpanLokal(KUNCI, token);
      var sisa = location.hash.replace(/(?:^#|&)sso=[^&]+/, '').replace(/^&/, '');
      history.replaceState(null, '', location.pathname + location.search + (sisa ? '#' + sisa : ''));
    } catch (e) { }
  })();

  function baca() {
    var token = bacaLokal(KUNCI);
    if (!token) return null;
    var p = isiToken(token);
    if (!p || !p.exp || Date.now() > Number(p.exp)) { hapusLokal(KUNCI); return null; }
    p.token = token;
    return p;
  }

  /** Login mahasiswa saja (aplikasi lama memakai ini). */
  function get() {
    var p = baca();
    return p && p.nim && p.jenis !== 'staf' ? p : null;
  }

  /** Login dosen/staf saja. */
  function getStaf() {
    var p = baca();
    return p && p.jenis === 'staf' ? p : null;
  }

  function simpan(token) { if (isiToken(token)) simpanLokal(KUNCI, token); }

  function urlMasuk(kembali, mode) {
    return PORTAL + '?kembali=' + encodeURIComponent(kembali || location.href) + (mode === 'staf' ? '&mode=staf' : '');
  }

  function masuk(kembali, mode) { location.href = urlMasuk(kembali, mode); }

  /** Keluar dari semua aplikasi. kePortal=false → tetap di halaman ini. */
  function keluar(kePortal) {
    hapusLokal(KUNCI);
    SESI_APLIKASI.forEach(hapusLokal);
    if (kePortal !== false) location.href = PORTAL;
  }

  function wajib() {
    var p = get();
    if (!p) masuk();
    return p;
  }

  /** NIM dinormalkan seperti di server: huruf besar, tanpa spasi, huruf O = angka 0. */
  function normNim(v) {
    return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0');
  }

  w.GiziSSO = {
    PORTAL: PORTAL, get: get, getStaf: getStaf, sesi: baca, simpan: simpan, masuk: masuk, urlMasuk: urlMasuk,
    keluar: keluar, wajib: wajib, normNim: normNim, isiToken: isiToken
  };
})(window);
