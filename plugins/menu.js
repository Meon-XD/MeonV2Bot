const chalk = require("chalk");
const moment = require("moment");

module.exports = async function(sock, chatInfo, settings) {
  const {
    from,
    isGroup,
    sender
  } = chatInfo;

  // Cek apakah user premium
  const isPremium = settings.premiumUsers.includes(sender.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, ''));

  // Menu text
  const menuText = `🤖 *${settings.botName} Menu* 🤖

  📅 *Date:* ${moment().format('DD/MM/YYYY')}
  ⏰ *Time:* ${moment().format('HH:mm:ss')}
  👤 *User:* ${isPremium ? '👑 Premium': '👤 Free'}
  🔧 *Prefix:* ${settings.prefix}

  ┌─「 *GENERAL* 」
  │📋 !menu
  │ℹ️  !info
  │👑 !owner
  │🏓 !ping
  │⏱️  !runtime
  │🚀 !speedtest
  └─────────────

  ┌─「 *GROUP* 」
  │👥 !tagall
  │⚙️  !group
  └─────────────

  ┌─「 *PREMIUM* 」
  │➕ !addpremium
  │➖ !delpremium
  │📋 !listpremium
  └─────────────

  ┌─「 *DOWNLOADER* 」
  │🎥 !ytmp4 <link>
  │🎵 !ytplay
  │🎵 !ytmp3 <link>
  │🎵 !tiktok <link>
  │📹 !facebook <link>
  └─────────────

  ┌─「 *SEARCH* 」
  │🔍 !google <query>
  │🔍 !ytsearch <query>
  └─────────────

  ┌─「 *MEDIA* 」
  │🎨 !sticker
  │🖼️  !toimg
  └─────────────

  📝 *Note:*
  • Fitur premium hanya bisa digunakan oleh user premium
  • Gunakan command dengan benar
  • Jangan spam bot!

  © ${settings.botName} - ${moment().format('YYYY')}`;

  try {
    await sock.sendMessage(from, {
      text: menuText,
      contextInfo: {
        externalAdReply: {
          title: settings.botName,
          body: "WhatsApp Bot by " + settings.ownerName,
          thumbnailUrl: "./meonn.png",
          sourceUrl: "https://github.com/Meon-XD",
          mediaType: 1,
          showAdAttribution: true
        }
      }
    });
  } catch (error) {
    console.error(chalk.red("Error sending menu:"), error);
    await sock.sendMessage(from, {
      text: "❌ Gagal mengirim menu!"
    });
  }
};