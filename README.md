# 🤖 WhatsApp Bot - Meon Bot

WhatsApp Bot lengkap berbasis Baileys dengan fitur-fitur canggih yang dapat dijalankan di Termux maupun komputer.

## ✨ Fitur Utama

### 📋 General Commands
- `!menu` - Menampilkan menu bot
- `!info` - Informasi bot
- `!owner` - Kontak owner
- `!ping` - Test kecepatan bot
- `!runtime` - Waktu aktif bot
- `!speedtest` - Speed test

### 👥 Group Commands
- `!tagall` - Tag semua member grup
- `!group open` - Buka grup
- `!group close` - Tutup grup
- `!group link` - Get link grup
- `!group revoke` - Revoke link grup
- `!group info` - Info grup
- `!group promote <nomor>` - Promote member
- `!group demote <nomor>` - Demote admin
- `!group add <nomor>` - Tambah member
- `!group kick <nomor>` - Keluarkan member
- `!group setname <nama>` - Ubah nama grup
- `!group setdesc <desc>` - Ubah deskripsi grup

### 👑 Premium Commands
- `!addpremium <nomor>` - Tambah user premium
- `!delpremium <nomor>` - Hapus user premium
- `!listpremium` - Daftar user premium

### 📥 Downloader Commands
- `!ytmp4 <link>` - Download YouTube Video
- `!ytmp3 <link>` - Download YouTube Audio
- `!tiktok <link>` - Download TikTok Video
- `!facebook <link>` - Download Facebook Video

### 🔍 Search Commands
- `!google <query>` - Google search

### 🎨 Media Commands
- `!sticker` - Buat sticker dari gambar
- `!toimg` - Convert sticker ke image

## 📁 Struktur Proyek

```
whatsapp-bot/
├── media/                      # Folder media (foto profil, dsb)
├── lib/                        # Logika tambahan (scraper, downloader, dll)
│   ├── yt.js
│   ├── tiktok.js
│   ├── facebook.js
│   └── google.js
├── plugins/                   # Folder modular fitur bot
│   ├── menu.js
│   ├── tagall.js
│   └── group.js
├── auth/                       # Folder session (auto create)
├── settings.json              # File setting bot
├── index.js                   # File utama koneksi dan start bot
├── bot.js                     # Logika bot, switch case fitur
├── package.json
└── README.md
```

## 🚀 Instalasi

### Di Termux
```bash

pkg update && pkg upgrade
pkg install nodejs git ffmpeg imagemagick
npm install -g npm
git clone https://github.com/Meon-XD/MeonV2Bot
cd MeonV2Bot
npm install
npm start
```

### Di Komputer/PC
```bash
git clone https://github.com/Meon-XD/MeonV2Bot
cd MeonV2Bot
npm install
npm start
```

## ⚙️ Konfigurasi

Edit file `settings.json` sesuai kebutuhan:

```json
{
  "botName": "MeonBot",
  "ownerName": "Meon",
  "ownerNumber": "6281234567890",
  "botNumber": "6281234567890",
  "prefix": ".",
  "autoRead": true,
  "autoReply": true,
  "selfBot": false,
  "premiumUsers": [
    "6281234567890"
  ],
  "groupSettings": {
    "antiLink": false,
    "antiSpam": false,
    "welcomeMessage": true,
    "leaveMessage": true
  },
  "features": {
    "youtubeDownloader": true,
    "tiktokDownloader": true,
    "facebookDownloader": true,
    "googleSearch": true,
    "aiChat": true,
    "stickerMaker": true,
    "imageToPdf": true,
    "voiceNote": true
  }
}
```

## 🔧 Cara Penggunaan

1. **Scan QR Code**
   - Jalankan bot dengan `npm start`
   - Scan QR code yang muncul di terminal dengan WhatsApp
   - Bot akan otomatis terkoneksi

2. **Menggunakan Command**
   - Gunakan prefix `!` sebelum command
   - Contoh: `!menu`, `!ytmp4 https://youtube.com/watch?v=...`

3. **Auto Reload**
   - Bot akan otomatis reload saat file `bot.js` diubah
   - Tidak perlu restart bot untuk update command

## 📱 Screenshots

[Coming Soon]

## 🛠️ Dependencies

- `@whiskeysockets/baileys` - WhatsApp Web API
- `pino` - Logger
- `chalk` - Terminal styling
- `figlet` - ASCII art
- `moment` - Date/time formatting
- `fs-extra` - File system operations
- `ytdl-core` - YouTube downloader
- `google-it` - Google search
- `axios` - HTTP client
- `inquirer` - Command line interface

## 📝 Notes

- Bot menggunakan session file untuk menyimpan kredensial
- File session akan disimpan di folder `auth/`
- Bot support multi-device
- Fitur premium hanya bisa digunakan oleh user yang terdaftar
- Beberapa fitur memerlukan koneksi internet yang stabil

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -am 'Tambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## 📄 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail

## 🐞 Bug Report

Jika menemukan bug, silakan buat issue di repository ini dengan format:
- Deskripsi bug
- Langkah-langkah reproduksi
- Screenshot (jika ada)
- Environment (Termux/PC, Node.js version)

## 📞 Kontak

- **Owner**: OwnerKeren
- **WhatsApp**: wa.me/6287744811004
- **GitHub**: https://github.com/Meon-XD

---

© 2024 WhiskeyBot. Made with ❤️ by Meon# MeonV2Bot
