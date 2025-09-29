const fs = require("fs-extra");
const chalk = require("chalk");
const moment = require('moment');
const { getContentType } = require('@whiskeysockets/baileys');
const settings = require("./settings.json");

// Import plugins
const menuPlugin = require("./plugins/menu");
const tagallPlugin = require("./plugins/tagall");
const groupPlugin = require("./plugins/group");

// Import lib functions
const ytDownloader = require("./lib/yt");
const tiktokDownloader = require("./lib/tiktok");
const facebookDownloader = require("./lib/facebook");
const googleSearch = require("./lib/google");

// Database sederhana untuk premium users
let premiumUsers = settings.premiumUsers || [];

// Fungsi untuk mengecek apakah user premium
function isPremium(number) {
  return premiumUsers.includes(number);
}

// Fungsi untuk menambah user premium
function addPremium(number) {
  const cleanNumber = number.replace('@s.whatsapp.net', '');
  if (!premiumUsers.includes(number)) {
    premiumUsers.push(number);
    fs.writeFileSync('./settings.json', JSON.stringify({ ...settings, premiumUsers }, null, 2));
    return true;
  }
  return false;
}

// Fungsi untuk menghapus user premium
function removePremium(number) {
  const index = premiumUsers.indexOf(number);
  if (index > -1) {
    premiumUsers.splice(index, 1);
    fs.writeFileSync('./settings.json', JSON.stringify({ ...settings, premiumUsers }, null, 2));
    return true;
  }
  return false;
}

// Fungsi untuk mendapatkan informasi chat
function getChatInfo(msg) {
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith("@g.us");
  const sender = isGroup ? msg.key.participant : msg.key.remoteJid;
  const body = msg.message?.conversation ||
               msg.message?.extendedTextMessage?.text ||
               msg.message?.imageMessage?.caption ||
               msg.message?.videoMessage?.caption ||
               msg.message?.stickerMessage?.caption ||
               '';

  return {
    from,
    isGroup,
    sender,
    body,
    prefix: settings.prefix,
    command: body.startsWith(settings.prefix) ? body.slice(settings.prefix.length).trim().split(/ +/)[0].toLowerCase() : null,
    args: body.startsWith(settings.prefix) ? body.slice(settings.prefix.length).trim().split(/ +/).slice(1) : [],
    msg
  };
}

// Fungsi untuk mengirim pesan dengan delay
async function sendMessageWithDelay(sock, from, content, delay = 1000) {
  await new Promise(resolve => setTimeout(resolve, delay));
  return sock.sendMessage(from, content);
}

// Fungsi untuk mengirim reaksi
async function sendReaction(sock, msgKey, emoji) {
  try {
    await sock.sendMessage(msgKey.remoteJid, {
      react: {
        text: emoji,
        key: msgKey
      }
    });
  } catch (error) {
    console.error(chalk.red("Error sending reaction:"), error);
  }
}

// Fungsi untuk mengunduh media
async function downloadMedia(msg) {
  const type = getContentType(msg.message);
  let buffer;

  if (type === 'imageMessage') {
    buffer = await msg.message.imageMessage.download();
  } else if (type === 'stickerMessage') {
    buffer = await msg.message.stickerMessage.download();
  } else {
    throw new Error('Unsupported media type for this command');
  }

  return buffer;
}

module.exports = async function(sock, msg) {
  try {
    const chatInfo = getChatInfo(msg);
    const { from, isGroup, sender, body, command, args } = chatInfo;

    // Log command
    if (command) {
      console.log(chalk.green(`[CMD] ${command} from ${sender}`));
      // Send reaction to command
      await sendReaction(sock, msg.key, "⏳");
    }

    // Skip jika bukan command
    if (!command) return;

    // Switch case untuk command
    switch (command) {
      case "menu":
      case "help":
        await menuPlugin(sock, chatInfo, settings);
        break;

      case "tagall":
        await tagallPlugin(sock, chatInfo);
        break;

      case "group":
        await groupPlugin(sock, chatInfo);
        break;

      case "ping":
        const start = Date.now();
        await sendMessageWithDelay(sock, from, { text: "Pong..." });
        const end = Date.now();
        await sendMessageWithDelay(sock, from, { text: `🏓 Pong!\nSpeed: ${end - start}ms` });
        break;

      case "owner":
        await sendMessageWithDelay(sock, from, {
          text: `👑 Owner: ${settings.ownerName}\n📞 Nomor: wa.me/${settings.ownerNumber.replace('@s.whatsapp.net', '')}`
        });
        break;

      case "info":
        const infoText = `🤖 *${settings.botName} Info*\n\n` +
                        `📅 *Time:* ${moment().format('DD/MM/YYYY HH:mm:ss')}\n` +
                        `👤 *Owner:* ${settings.ownerName}\n` +
                        `🔧 *Prefix:* ${settings.prefix}\n` +
                        `📊 *Status:* Online\n` +
                        `🔗 *GitHub:* https://github.com/Meon-XD`;
        await sendMessageWithDelay(sock, from, { text: infoText });
        break;

      case "addpremium":
        if (sender !== settings.ownerNumber) {
          await sendMessageWithDelay(sock, from, { text: "❌ Hanya owner yang bisa menggunakan command ini!" });
          break;
        }
        if (!args[0]) {
          await sendMessageWithDelay(sock, from, { text: "❌ Masukkan nomor target!\nContoh: .addpremium 6281234567890" });
          break;
        }
        const targetNumber = `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
        if (addPremium(targetNumber)) {
          await sendMessageWithDelay(sock, from, { text: `✅ Berhasil menambahkan ${args[0]} ke daftar premium!` });
        } else {
          await sendMessageWithDelay(sock, from, { text: `❌ Nomor ${args[0]} sudah premium!` });
        }
        break;

      case "delpremium":
        if (sender !== settings.ownerNumber) {
          await sendMessageWithDelay(sock, from, { text: "❌ Hanya owner yang bisa menggunakan command ini!" });
          break;
        }
        if (!args[0]) {
          await sendMessageWithDelay(sock, from, { text: "❌ Masukkan nomor target!\nContoh: .delpremium 6281234567890" });
          break;
        }
        const delTargetNumber = `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
        if (removePremium(delTargetNumber)) {
          await sendMessageWithDelay(sock, from, { text: `✅ Berhasil menghapus ${args[0]} dari daftar premium!` });
        } else {
          await sendMessageWithDelay(sock, from, { text: `❌ Nomor ${args[0]} tidak ditemukan di daftar premium!` });
        }
        break;

      case "listpremium":
        const premiumList = premiumUsers.length > 0 ?
                            premiumUsers.map((num, index) => `${index + 1}. wa.me/${num.replace('@s.whatsapp.net', '')}`).join('\n') :
                            "Tidak ada user premium";
        await sendMessageWithDelay(sock, from, { text: `👑 *Daftar User Premium*\n\n${premiumList}` });
        break;

      case "google":
        if (!settings.features.googleSearch) {
          await sendMessageWithDelay(sock, from, { text: "❌ Fitur Google Search dinonaktifkan!" });
          break;
        }
        if (!args[0]) {
          await sendMessageWithDelay(sock, from, { text: "❌ Masukkan kata kunci pencarian!\nContoh: .google cara membuat bot whatsapp" });
          break;
        }
        await sendReaction(sock, msg.key, "🔍");
        await googleSearch(sock, chatInfo);
        break;

      case "ytsearch":
        if (!settings.features.youtubeDownloader) {
          await sendMessageWithDelay(sock, from, { text: "❌ Fitur YouTube Search dinonaktifkan!" });
          break;
        }
        if (!args[0]) {
          await sendMessageWithDelay(sock, from, { text: "❌ Masukkan kata kunci pencarian!\nContoh: .ytsearch nama lagu" });
          break;
        }
        await sendReaction(sock, msg.key, "🔍");
        await ytDownloader(sock, chatInfo, command);
        break;

      case "ytplay":
      case "play":
        if (!settings.features.youtubeDownloader) {
          await sendMessageWithDelay(sock, from, { text: "❌ Fitur YouTube Play dinonaktifkan!" });
          break;
        }
        if (!args[0]) {
          await sendMessageWithDelay(sock, from, { text: "❌ Masukkan link YouTube atau kata kunci!\nContoh: .ytplay nama lagu" });
          break;
        }
        await sendReaction(sock, msg.key, "🎵");
        await ytDownloader(sock, chatInfo, command);
        break;

      case "ytmp4":
      case "ytmp3":
        if (!settings.features.youtubeDownloader) {
          await sendMessageWithDelay(sock, from, { text: "❌ Fitur YouTube Downloader dinonaktifkan!" });
          break;
        }
        if (!args[0]) {
          await sendMessageWithDelay(sock, from, { text: "❌ Masukkan link YouTube!\nContoh: .ytmp4 https://youtube.com/watch?v=..." });
          break;
        }
        await sendReaction(sock, msg.key, command === "ytmp4" ? "🎥" : "🎵");
        await ytDownloader(sock, chatInfo, command);
        break;

      case "tiktok":
        if (!settings.features.tiktokDownloader) {
          await sendMessageWithDelay(sock, from, { text: "❌ Fitur TikTok Downloader dinonaktifkan!" });
          break;
        }
        if (!args[0]) {
          await sendMessageWithDelay(sock, from, { text: "❌ Masukkan link TikTok!\nContoh: .tiktok https://tiktok.com/..." });
          break;
        }
        await sendReaction(sock, msg.key, "🎵");
        await tiktokDownloader(sock, chatInfo);
        break;

      case "facebook":
      case "fb":
        if (!settings.features.facebookDownloader) {
          await sendMessageWithDelay(sock, from, { text: "❌ Fitur Facebook Downloader dinonaktifkan!" });
          break;
        }
        if (!args[0]) {
          await sendMessageWithDelay(sock, from, { text: "❌ Masukkan link Facebook!\nContoh: .facebook https://facebook.com/..." });
          break;
        }
        await sendReaction(sock, msg.key, "📹");
        await facebookDownloader(sock, chatInfo);
        break;

      case "sticker":
      case "s":
        if (!settings.features.stickerMaker) {
          await sendMessageWithDelay(sock, from, { text: "❌ Fitur Sticker Maker dinonaktifkan!" });
          break;
        }
        if (!msg.message?.imageMessage) {
          await sendMessageWithDelay(sock, from, { text: "❌ Balas gambar dengan caption .sticker" });
          break;
        }
        await sendReaction(sock, msg.key, "🎨");
        try {
          const media = await downloadMedia(msg);
          await sock.sendMessage(from, { sticker: media });
        } catch (error) {
          console.error(chalk.red("Error creating sticker:"), error);
          await sendMessageWithDelay(sock, from, { text: "❌ Gagal membuat sticker!" });
        }
        break;

      case "toimg":
        if (!settings.features.stickerMaker) {
          await sendMessageWithDelay(sock, from, { text: "❌ Fitur Sticker Maker dinonaktifkan!" });
          break;
        }
        if (!msg.message?.stickerMessage) {
          await sendMessageWithDelay(sock, from, { text: "❌ Balas sticker dengan caption .toimg" });
          break;
        }
        await sendReaction(sock, msg.key, "🖼️");
        try {
          const media = await downloadMedia(msg);
          await sock.sendMessage(from, { image: media, caption: "Berhasil convert sticker ke image!" });
        } catch (error) {
          console.error(chalk.red("Error converting sticker to image:"), error);
          await sendMessageWithDelay(sock, from, { text: "❌ Gagal convert sticker ke image!" });
        }
        break;

      case "runtime":
        const runtime = process.uptime();
        const hours = Math.floor(runtime / 3600);
        const minutes = Math.floor((runtime % 3600) / 60);
        const seconds = Math.floor(runtime % 60);
        await sendMessageWithDelay(sock, from, { text: `⏱️ *Runtime Bot*\n\n${hours} jam ${minutes} menit ${seconds} detik` });
        break;

      case "speedtest":
        await sendMessageWithDelay(sock, from, { text: "🔄 Testing speed..." });
        const speedStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, 1000));
        const speedEnd = Date.now();
        await sendMessageWithDelay(sock, from, { text: `🚀 *Speed Test*\n\nResponse time: ${speedEnd - speedStart}ms` });
        break;

      default:
        await sendMessageWithDelay(sock, from, { text: "❌ Command tidak ditemukan! Ketik .menu untuk melihat daftar command." });
    }

    // Send success reaction
    if (command) {
      await sendReaction(sock, msg.key, "✅");
    }
  } catch (err) {
    console.error(chalk.red("[ERROR]"), err);
    await sendMessageWithDelay(sock, msg.key.remoteJid, { text: "❌ Terjadi kesalahan pada bot!" });
  }
};