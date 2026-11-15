/*
 * ISI BERANDA GIZI-LINK — Visi, Misi, Profil Lulusan, dan CPL tiap program studi.
 *
 * Untuk memperbarui isi (mis. revisi kurikulum), cukup ubah teks di file ini lalu simpan (Commit) di GitHub.
 * Aturan singkat:
 *   - Setiap teks diapit tanda kutip '...' dan diakhiri koma.
 *   - Jangan menghapus tanda kurung [ ] { } dan koma di antaranya.
 *   - Tanda {K} di dalam CPL = rumusan keunggulan (lihat KEUNGGULAN di bawah).
 *
 * Sumber: Profil Jurusan Gizi (SPMB 2027) untuk visi & misi;
 *         Pedoman KPT Poltekkes Kemenkes (Dirjen Nakes 2026), Tabel 3.1, untuk profil lulusan & CPL.
 */
window.PROFIL_PRODI = (function () {
// Rumusan keunggulan di dalam CPL. "ringkas" tampil lebih dulu; tombol "Tampilkan rumusan lengkap" memakai "lengkap".
const KEUNGGULAN = {
  ringkas: 'kesehatan ibu, bayi dan anak',
  lengkap: 'penyakit kanker/kesehatan jantung/kesehatan otak dan stroke/kesehatan ginjal/kesehatan paru/kesehatan hati/diabetes mellitus/kesehatan ibu, bayi dan anak/dan malaria'
};
const SUMBER_CPL = 'Pedoman KPT Poltekkes Kemenkes (Dirjen Nakes 2026), Tabel 3.1.';
const PRODI = {
  d3: {
    pendek: 'D3 Gizi', nama: 'Program Studi Gizi Program Diploma Tiga',
    chip: ['Diploma Tiga', '3 tahun · 6 semester', 'Gelar A.Md.Gz'], akre: 'Akreditasi UNGGUL',
    visi: 'Menghasilkan tenaga pelaksana asuhan gizi yang responsif, inovatif, berdaya saing global dan unggul dalam kesehatan ibu, bayi, dan anak.',
    misi: ['Menyelenggarakan pendidikan berkualitas melalui peningkatan keterampilan di bidang gizi dengan kekhususan pada pelayanan asuhan gizi ibu, bayi dan anak.',
      'Melaksanakan penelitian terapan dalam pelayanan asuhan gizi ibu, bayi dan anak.',
      'Melaksanakan pengabdian masyarakat dengan membangun jejaring dan kemitraan dengan industri dan lembaga terkait dalam pelayanan asuhan gizi ibu, bayi dan anak.'],
    profil: [
      ['Pelaksana Asuhan Gizi', 'Memberikan pelayanan asuhan gizi dan konseling gizi pada klien sehat dan klien kategori khusus (ibu hamil, ibu menyusui, bayi, balita, anak, remaja, dewasa, lansia) secara individu, kelompok, dan masyarakat dengan menggunakan prosedur skrining gizi dan PAGT, dengan penekanan promotif dan preventif.'],
      ['Pelaksana Program Gizi Masyarakat', 'Memberikan pelayanan program gizi masyarakat secara promotif, preventif, kuratif, dan rehabilitatif sesuai dengan prosedur baku dan mekanisme yang telah ditetapkan, pada individu, maupun kelompok, dan masyarakat, dengan penekanan promotif dan preventif.'],
      ['Pelaksana Penyelenggaraan Makanan Institusi', 'Memberikan pelayanan penyelenggaraan makanan institusi untuk pemenuhan kebutuhan gizi dan dietetik dalam kondisi normal maupun darurat yang meliputi matra darat, laut, dan udara, dengan menggunakan prosedur baku yang telah ditetapkan, pada klien individu, kelompok, masyarakat.'],
      ['Edukator dan Komunikator Gizi', 'Menggali dan bertukar informasi secara verbal dan non verbal, dengan memanfaatkan berbagai bentuk media, dalam memberikan promosi dan edukasi gizi, pangan dan kesehatan kepada klien individu, kelompok, masyarakat, menggunakan IPTEKS mutakhir, dengan penekanan promotif dan preventif.']],
    cpl: ['Lulusan mampu melaksanakan pelayanan asuhan gizi pada daur kehidupan dengan keunggulan pada {K} sesuai standar profesi dengan sikap bertanggung jawab dan taat hukum.',
      'Lulusan mampu melaksanakan program gizi masyarakat dengan keunggulan pengendalian faktor risiko {K}, sesuai dengan standar profesi, dilandasi kerjasama lintas program dan lintas sektor.',
      'Lulusan mampu melaksanakan penyelenggaraan makanan institusi dengan keunggulan {K} sesuai standar profesi, dan menunjukkan sikap tanggung jawab.',
      'Lulusan mampu melaksanakan promosi gizi untuk pengendalian faktor risiko dengan keunggulan {K} sesuai standar profesi dengan menunjukkan sikap menghargai keanekaragaman budaya.',
      'Lulusan mampu menerapkan literasi IPTEKS gizi dalam pengendalian faktor risiko masalah gizi dengan keunggulan {K} sesuai standar profesi secara profesional.']
  },
  d4: {
    pendek: 'D4 Gizi dan Dietetika', nama: 'Program Studi Gizi dan Dietetika Program Sarjana Terapan',
    chip: ['Sarjana Terapan', '4 tahun · 8 semester', 'Gelar S.Tr.Gz'], akre: 'Akreditasi UNGGUL',
    visi: 'Menghasilkan Sarjana Terapan Gizi dan Dietetika yang responsif, inovatif, berdaya saing dan unggul pada produk gizi dan diet untuk Kesehatan Ibu, Bayi dan Anak di tahun 2034.',
    misi: ['Mengembangkan pendidikan produk gizi dan diet yang ramah lingkungan untuk menunjang kesehatan ibu, bayi dan anak.',
      'Melakukan riset terapan dalam produk gizi dan diet yang ramah lingkungan untuk menunjang kesehatan ibu, bayi dan anak.',
      'Melaksanakan pengabdian masyarakat dengan membangun kemitraan pada industri atau lembaga terkait yang memanfaatkan produk gizi dan diet pada pelayanan kesehatan ibu, bayi dan anak.',
      'Mengimplementasikan transformasi kesehatan melalui kesehatan ibu, bayi dan anak pada kegiatan Tri Dharma Perguruan Tinggi.'],
    profil: [
      ['Pengelola Asuhan Gizi', 'Mengelola pelayanan asuhan gizi dan konseling gizi pada klien sehat, klien kategori khusus (ibu hamil, menyusui, bayi, balita, anak, remaja, dewasa, lansia, olahragawan), dan pasien dengan maksimal 2 komplikasi, secara individu, kelompok, masyarakat dengan menggunakan prosedur skrining gizi dan PAGT.'],
      ['Pengelola Program Gizi Masyarakat', 'Mengelola program gizi dan pemberdayaan masyarakat secara preventif, kuratif, rehabilitatif dan melakukan analisis data indikator masalah gizi sesuai dengan prosedur baku dan mekanisme yang telah ditetapkan, pada individu, maupun kelompok, dan masyarakat.'],
      ['Pengelola Penyelenggaraan Makanan Institusi', 'Mengelola pelayanan penyelenggaraan makanan institusi untuk pemenuhan gizi dan dietetik dalam kondisi normal maupun darurat yang meliputi matra darat, laut, dan udara, dengan menggunakan prosedur baku yang telah ditetapkan, pada klien individu, kelompok, masyarakat.'],
      ['Edukator dan Komunikator Gizi', 'Menggali dan bertukar informasi secara verbal dan non verbal dengan memanfaatkan berbagai bentuk media, dalam memberikan advokasi, promosi, dan edukasi pangan, gizi, dan kesehatan kepada klien individu, kelompok, masyarakat dan profesi, menggunakan IPTEKS dan prosedur baku.'],
      ['Asisten Peneliti Gizi Terapan', 'Memanfaatkan teknologi tepat guna dan prosedur baku penelitian dalam penelitian bidang gizi klinik, gizi masyarakat, penyelenggaraan makanan dan kesehatan pada kegiatan promotif, preventif, kuratif dan rehabilitatif secara komprehensif.']],
    cpl: ['Mampu mengelola pelayanan asuhan gizi pada daur kehidupan dengan keunggulan pada {K} sesuai standar profesi dengan sikap bertanggung jawab dan taat hukum.',
      'Mampu mengelola program gizi masyarakat dengan keunggulan pengendalian faktor risiko {K} sesuai dengan standar profesi, dilandasi kerjasama lintas program dan lintas sektor.',
      'Mampu mengelola penyelenggaraan makanan institusi dengan keunggulan {K} sesuai standar profesi, dan menunjukkan sikap tanggung jawab.',
      'Mampu mengelola promosi gizi untuk pengendalian faktor risiko dengan keunggulan {K} sesuai standar profesi dengan menunjukkan sikap menghargai keanekaragaman budaya.',
      'Mampu mengelola literasi IPTEKS gizi dalam pengendalian faktor risiko masalah gizi dengan keunggulan {K} sesuai standar profesi secara profesional.',
      'Mampu menerapkan teknologi tepat guna bidang gizi menggunakan metode ilmiah dengan keunggulan pengendalian {K} didasari sikap kejujuran dan etika profesi.']
  },
  prof: {
    pendek: 'Profesi Dietisien', nama: 'Program Studi Pendidikan Profesi Dietisien',
    chip: ['Pendidikan Profesi', '1 tahun · 2 semester', 'Gelar Dietisien'], akre: 'Akreditasi BAIK SEKALI',
    visi: 'Menghasilkan dietisien yang responsif, inovatif, berdaya saing global, dan unggul pada pencegahan stunting untuk kesehatan ibu, bayi, dan anak.',
    misi: ['Menyelenggarakan pendidikan berkualitas melalui peningkatan kompetensi dietisien yang unggul pada pencegahan stunting untuk kesehatan ibu, bayi, dan anak.',
      'Mengembangkan riset terapan pencegahan dan penanggulangan stunting untuk kesehatan ibu, bayi, dan anak.',
      'Melaksanakan pengabdian masyarakat untuk pencegahan dan penanggulangan stunting untuk kesehatan ibu, bayi, dan anak.',
      'Meningkatkan kerja sama dan kemitraan dengan lembaga terkait dan industri di tingkat lokal, nasional, dan global dalam pencegahan dan penanggulangan stunting untuk kesehatan ibu, bayi, dan anak.'],
    profil: [
      ['Pemberi Asuhan Gizi (Nutritional Care)', 'Memberikan asuhan gizi (Nutritional Care) dan edukasi pasien mengenai gizi sebagai bagian dari tim kesehatan pasien.'],
      ['Komunikator', 'Konselor gizi mandiri: merencanakan dan memberikan edukasi pada klien mengenai hubungan makanan/minuman, kebugaran dan kesehatan serta memantau dan menilai hasilnya sebagai upaya preventif dan promotif. Advokator dan komunikator program gizi: melakukan advokasi program gizi kepada pemerintah, perusahaan, lembaga swadaya masyarakat, dan legislatif; serta komunikasi gizi dengan berbagai media kepada konsumen, masyarakat, dan dunia usaha tentang gizi seimbang dan hasil produk gizi baru.'],
      ['Manajer', 'Penyelia penyelenggaraan makanan: memberikan saran atau konsultasi pada manajer/pengelola pelayanan makanan atau restoran, pusat pelatihan atlet, panti wreda, katering perusahaan dan sekolah, serta pemasok/pedagang dan penyalur makanan; mengelola operasional pelayanan makanan mulai dari pembelian, persiapan dan pengolahan, distribusi hingga konsumsi, serta melakukan monitoring dan evaluasi termasuk pengelolaan sumber daya.'],
      ['Pengelola Program Gizi', 'Merancang, mengelola, memantau, dan mengevaluasi program gizi sebagai upaya preventif dan promotif.'],
      ['Pendidik', 'Penyelia pendidikan dan pelatihan gizi: membimbing dan mengajar mahasiswa pendidikan gizi dan tenaga kesehatan terkait ilmu gizi dan makanan; merancang modul, melaksanakan, dan mengevaluasi kegiatan pelatihan gizi dan keamanan pangan.'],
      ['Peneliti', 'Pengembang produk alternatif gizi: mengarahkan atau melaksanakan uji coba guna mencari alternatif makanan atau produk yang dapat direkomendasikan kepada pasien atau klien. Penyelia penelitian: mengarahkan atau melaksanakan uji coba atau penelitian untuk menjawab pertanyaan atau masalah gizi yang kritis.']],
    cpl: ['Lulusan mampu mengelola secara mandiri asuhan gizi dan dietetik individu dengan keunggulan {K} sesuai standar profesi menjunjung nilai kemanusiaan, moral, komunikasi efektif, dan etika.',
      'Lulusan mampu mengelola secara mandiri asuhan gizi dan dietetik pada komunitas dengan keunggulan {K} sesuai standar profesi, berwawasan sosial budaya, komunikasi efektif, dan etika.',
      'Lulusan mampu mengelola secara mandiri penyelenggaraan makanan diet dengan keunggulan {K} sesuai standar profesi secara bertanggungjawab dan berperilaku profesional.',
      'Lulusan mampu mengembangkan pendidikan dan pelatihan dalam pelayanan asuhan gizi dan dietetik dengan keunggulan {K} menggunakan teknologi informasi sesuai standar profesi secara bertanggungjawab, disiplin, dan integritas.',
      'Lulusan mampu merancang riset terapan bidang gizi dan dietetik melalui penguasaan IPTEKS dan metode ilmiah dengan keunggulan {K} sesuai standar profesi secara sistematis, logis, dan bertanggungjawab.',
      'Lulusan mampu mengembangkan praktik mandiri dalam asuhan gizi rawat jalan dan perawatan berkelanjutan dengan keunggulan {K} sesuai standar profesi, mawas diri, dan profesional.']
  }
};
return { KEUNGGULAN: KEUNGGULAN, SUMBER_CPL: SUMBER_CPL, PRODI: PRODI };
})();
