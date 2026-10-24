// Articles for the listing (/artikel/) and detail (/artikel/baca/?id=…) pages.
// Sample editorial content: replace before launch.

/** Points for finishing any article. The only place this amount is set. */
export const ARTICLE_POINTS = 100;

export const articleUrl = (id) => `/artikel/baca/?id=${encodeURIComponent(id)}`;

// Covers: Unsplash photos (Unsplash License), cropped to 3:2 in assets/articles/.
// Sources: images.unsplash.com/photo-<id> — traffic 1761295908283-9ee7782e82bd,
// friends 1528977695568-bd5e5069eb61, duffel 1448582649076-3981753123b5,
// magazine 1769021488255-c58d0b4748f0, caps 1653704841996-c2ed854aedd8,
// tumblers 1637496148496-26e341f3bec6.
const cover = (slug, position) => ({
  src: `/assets/articles/optimized/${slug}-800.webp`,
  srcset: `/assets/articles/optimized/${slug}-800.webp 800w, /assets/articles/optimized/${slug}-1600.webp 1600w`,
  width: 1600, height: 1066, position,
});

const images = {
  traffic: cover("traffic-rain-windshield", "35% 60%"),
  friends: cover("friends-cafe-golden-hour", "50% 40%"),
  duffel: cover("canvas-duffel-bag", "40% 60%"),
  magazine: cover("open-magazine-armchair", "50% 50%"),
  caps: cover("caps-wooden-shelf", "50% 50%"),
  tumblers: cover("coffee-steel-tumblers", "40% 50%"),
};

// Newest first. Body blocks: ["p", text] for paragraphs, ["h", text] for subheadings.
export const articles = [
  {
    id: "tenang-di-jalan",
    title: "Tetap Tenang di Tengah Macet",
    category: "Gaya Hidup",
    readMinutes: 4,
    date: "2026-10-21",
    excerpt: "Macet itu pasti. Yang bisa lo atur cuma cara lo ngadepinnya. Empat kebiasaan kecil biar perjalanan pulang terasa lebih ringan.",
    image: images.traffic,
    imageAlt: "Pemandangan dari dalam mobil saat hujan malam, lampu rem merah kendaraan di depan berpendar di kaca",
    body: [
      ["p", "Macet itu pasti. Yang bisa lo atur cuma cara lo ngadepinnya. Beberapa kebiasaan kecil ini bikin perjalanan pulang terasa lebih ringan, tanpa harus nunggu jalanan sepi."],
      ["h", "Berangkat dengan kepala dingin"],
      ["p", "Kasih jeda lima menit sebelum jalan. Cek rute, isi botol minum, dan pilih playlist dari rumah, bukan pas lagi berhenti di lampu merah."],
      ["h", "Jadikan perjalanan waktu buat diri sendiri"],
      ["p", "Podcast, audiobook, atau sekadar diam. Buat banyak orang, perjalanan pulang adalah satu-satunya waktu tenang di hari itu. Pakai sebaik mungkin."],
      ["h", "Duduk yang bener"],
      ["p", "Atur posisi kursi dan sandaran sebelum berangkat. Badan yang nyaman bikin lo jauh lebih sabar di jalan."],
      ["h", "Terima yang nggak bisa diubah"],
      ["p", "Klakson nggak bikin jalan jadi kosong. Tarik napas, nikmati lagunya, dan sampai di rumah dengan selamat."],
    ],
  },
  {
    id: "tongkrongan-yang-bikin-tumbuh",
    title: "Tongkrongan yang Bikin Lo Tumbuh",
    category: "Komunitas",
    readMinutes: 3,
    date: "2026-10-18",
    excerpt: "Bukan soal seberapa sering nongkrong, tapi sama siapa. Cara milih lingkaran pertemanan yang bikin lo makin berkembang.",
    image: images.friends,
    imageAlt: "Tiga pria duduk santai sambil ngobrol di tembok kafe saat matahari sore",
    body: [
      ["p", "Umur nambah, waktu luang makin sempit. Makanya lingkaran pertemanan yang lo pilih makin penting: mereka yang nemenin lo ngobrol, berbagi referensi, dan kadang ngingetin lo waktu lagi salah arah."],
      ["h", "Cari yang bikin penasaran"],
      ["p", "Teman yang punya minat beda sering jadi pintu ke hal baru. Hari ini ngobrolin motor, minggu depan lo diajak ikut kelas kopi."],
      ["h", "Datang, bukan cuma nimbrung di grup"],
      ["p", "Obrolan di grup chat gampang hilang. Ketemu langsung, walau cuma sejam, bikin hubungan jauh lebih awet."],
      ["h", "Jadi yang ngajak duluan"],
      ["p", "Nggak perlu nunggu diundang. Ajak dua-tiga orang ngopi, atau datang bareng ke event komunitas. Tongkrongan yang bagus biasanya dimulai dari satu orang yang mau repot."],
    ],
  },
  {
    id: "isi-travel-bag",
    title: "Isi Travel Bag Buat Weekend Getaway",
    category: "Perjalanan",
    readMinutes: 3,
    date: "2026-10-16",
    excerpt: "Dua hari, satu tas. Cara packing ringkas biar lo nggak bawa barang yang ujung-ujungnya nggak kepakai.",
    image: images.duffel,
    imageAlt: "Duffel bag kanvas cokelat di lantai kayu dekat jendela",
    body: [
      ["p", "Dua hari, satu tas. Kuncinya bukan bawa sebanyak mungkin, tapi bawa yang benar-benar kepakai."],
      ["h", "Mulai dari daftar"],
      ["p", "Tulis rencana dua hari lo: ke mana aja dan ngapain. Dari situ kelihatan baju apa yang perlu, dan mana yang cuma \"jaga-jaga\"."],
      ["h", "Pilih warna yang gampang dipadu"],
      ["p", "Dua celana dan tiga atasan dengan warna netral bisa jadi lima kombinasi. Sepatu cukup satu yang nyaman, satu lagi dipakai di jalan."],
      ["h", "Gulung, jangan lipat"],
      ["p", "Baju yang digulung lebih hemat tempat dan nggak gampang kusut. Barang kecil masukin ke pouch biar nggak tercecer di dasar tas."],
    ],
  },
  {
    id: "balik-ke-bacaan-cetak",
    title: "Balik ke Bacaan Cetak di Era Layar",
    category: "Literasi",
    readMinutes: 3,
    date: "2026-10-12",
    excerpt: "Majalah dan buku fisik bikin lo baca lebih pelan dan lebih nempel. Cara mulai lagi tanpa harus jadi kutu buku.",
    image: images.magazine,
    imageAlt: "Majalah terbuka di atas kursi berbahan bouclé dengan cahaya hangat",
    body: [
      ["p", "Seharian kita baca dari layar: chat, berita, caption. Banyak, tapi jarang ada yang benar-benar nempel. Bacaan cetak ngasih jeda yang beda."],
      ["h", "Mulai dari yang tipis"],
      ["p", "Majalah atau buku esai pendek lebih gampang diselesaikan. Rasa \"beres\" itu yang bikin lo pengin lanjut ke bacaan berikutnya."],
      ["h", "Kasih tempat khusus"],
      ["p", "Taruh satu bacaan di meja kopi atau di tas kerja. Waktu nunggu atau istirahat siang jadi kesempatan baca, bukan scroll."],
      ["h", "Simpan yang menarik"],
      ["p", "Lipat halaman, tandai kalimat, atau foto paragraf favorit. Bacaan yang lo tandai biasanya jadi bahan obrolan paling seru di tongkrongan."],
    ],
  },
  {
    id: "rawat-topi",
    title: "Cara Merawat Topi Biar Awet",
    category: "Perawatan",
    readMinutes: 3,
    date: "2026-10-09",
    excerpt: "Topi favorit lo pantas umur panjang. Mulai dari cara nyuci sampai cara nyimpen biar bentuknya nggak berubah.",
    image: images.caps,
    imageAlt: "Deretan topi baseball berbagai warna tersusun rapi di rak kayu",
    body: [
      ["p", "Topi yang sering dipakai pantas dirawat. Dengan beberapa langkah sederhana, bentuk dan warnanya bisa bertahan lama."],
      ["h", "Cuci pakai tangan"],
      ["p", "Hindari mesin cuci. Pakai air dingin dan sedikit sabun lembut, lalu sikat pelan bagian yang kotor, terutama di sisi dalam dekat dahi."],
      ["h", "Keringkan sesuai bentuknya"],
      ["p", "Isi bagian dalam topi dengan handuk kecil dan biarkan kering di tempat teduh. Sinar matahari langsung bikin warna cepat pudar."],
      ["h", "Simpan dengan benar"],
      ["p", "Jangan ditumpuk di bawah barang berat. Gantung atau taruh di rak supaya lengkungan visornya tetap terjaga."],
    ],
  },
  {
    id: "bawa-tumbler",
    title: "Bawa Tumbler Sendiri, Kenapa Nggak?",
    category: "Kebiasaan",
    readMinutes: 2,
    date: "2026-10-02",
    excerpt: "Kebiasaan kecil yang hemat, praktis, dan bikin kopi lo tetap di suhu yang pas sampai kantor.",
    image: images.tumblers,
    imageAlt: "Kopi panas dituang dari termos ke dua tumbler stainless",
    body: [
      ["p", "Kebiasaan kecil sering jadi yang paling kerasa dampaknya. Bawa tumbler sendiri salah satunya."],
      ["h", "Lebih hemat"],
      ["p", "Banyak kedai kopi kasih potongan harga buat pelanggan yang bawa wadah sendiri. Kalau rutin, selisihnya lumayan."],
      ["h", "Minuman tetap di suhu yang pas"],
      ["p", "Tumbler dua lapis jaga kopi tetap hangat atau es teh tetap dingin lebih lama dibanding gelas sekali pakai."],
      ["h", "Lebih sedikit sampah"],
      ["p", "Satu tumbler bisa menggantikan ratusan gelas plastik dalam setahun. Kecil buat lo, besar buat sekitar lo."],
    ],
  },
];
