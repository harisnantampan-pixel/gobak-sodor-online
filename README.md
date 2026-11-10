# Gobak Sodor 3D Online — deployment-ready starter

Game browser multiplayer dengan arena 3D (Three.js) dan sinkronisasi real-time Socket.IO.

## Fitur prototipe
- Maksimal 20 pemain per room.
- Kode room otomatis jika kolom kode dikosongkan.
- Bergabung dengan kode room atau link undangan `?room=KODE`.
- Pembagian tim otomatis agar jumlah pemain seimbang.
- Tombol bagikan room dan kontrol HP/keyboard.

## Jalankan lokal
1. Install Node.js 18 atau lebih baru.
2. Jalankan `npm install`, lalu `npm start`.
3. Buka `http://localhost:3000`.

## Deploy melalui Render
1. Hubungkan repository GitHub ini ke Render.
2. Pilih **New > Blueprint**.
3. Pilih repository ini; Render membaca `render.yaml`.
4. Tinjau lalu klik **Apply** dan tunggu deployment selesai.
5. Render akan memberikan URL `https://...onrender.com`.

## Batasan
Ini MVP untuk diuji, belum rilis produksi. Belum ada akun, moderasi, otorisasi host, reconnect, penyimpanan skor, timer/round reset, validasi aturan penuh di server, atau anti-cheat. Three.js dimuat dari CDN sehingga perlu internet.
