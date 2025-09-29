const ytdl = require("ytdl-core");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

module.exports = async function(sock, chatInfo, command) {
  const {
    from,
    args,
    sender
  } = chatInfo;

  try {
    // Create media directory if not exists
    const mediaDir = path.join(__dirname, '..', 'media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, {
        recursive: true
      });
    }

    // Fungsi untuk mengirim pesan dengan delay
    async function sendMessage(content) {
      await sock.sendMessage(from, content);
    }

    // Fungsi untuk mendownload dan mengirim audio
    async function downloadAndSendAudio(url, title) {
      const audioPath = path.join(mediaDir, `${Date.now()}.mp3`);
      const audioStream = ytdl(url, {
        filter: "audioonly",
        quality: "highestaudio",
        format: "mp3"
      });

      const fileStream = fs.createWriteStream(audioPath);
      audioStream.pipe(fileStream);

      return new Promise((resolve, reject) => {
        fileStream.on('finish', async () => {
          try {
            await sendMessage( {
              audio: fs.readFileSync(audioPath),
              mimetype: "audio/mpeg",
              caption: `✅ *Download Complete*\n\n🎵 ${title}`
            });
            fs.unlinkSync(audioPath);
            resolve();
          } catch (error) {
            console.error(chalk.red("Error sending audio:"), error);
            await sendMessage( {
              text: "❌ Gagal mengirim audio!"
            });
            reject(error);
          }
        });
        fileStream.on('error', (error) => {
          console.error(chalk.red("Error writing audio file:"), error);
          reject(error);
        });
      });
    }

    if (command === 'ytsearch') {
      if (!args.length) {
        await sendMessage( {
          text: "❌ Masukkan kata kunci pencarian!\nContoh: .ytsearch nama lagu"
        });
        return;
      }

      const query = args.join(" ");
      await sendMessage( {
        text: `🔍 Mencari "${query}" di YouTube...`
      });

      const results = await yts(query);
      const videos = results.videos.slice(0, 5); // Ambil 5 hasil teratas

      if (!videos.length) {
        await sendMessage( {
          text: "❌ Tidak ada hasil ditemukan!"
        });
        return;
      }

      const searchResults = videos.map((video, index) => {
        return `${index + 1}. *${video.title}*\n` +
        `⏱️ Duration: ${video.duration.toString()}\n` +
        `👀 Views: ${video.views.toLocaleString()}\n` +
        `🔗 Link: ${video.url}`;
      }).join('\n\n');

      await sendMessage( {
        text: `📋 *Hasil Pencarian YouTube: "${query}"*\n\n${searchResults}\n\nBalas dengan nomor video untuk mendownload audio (contoh: 1)`
      });
      return;
    }

    if (command === 'ytplay' || command === 'play') {
      if (!args.length) {
        await sendMessage( {
          text: "❌ Masukkan link YouTube atau kata kunci!\nContoh: .ytplay nama lagu"
        });
        return;
      }

      const input = args.join(" ");
      let url = input;

      // Jika input bukan URL, cari video berdasarkan kata kunci
      if (!ytdl.validateURL(input)) {
        const results = await yts(input);
        const video = results.videos[0];
        if (!video) {
          await sendMessage( {
            text: "❌ Tidak ada vanadium ditemukan untuk kata kunci tersebut!"
          });
          return;
        }
        url = video.url;
      }

      // Validate YouTube URL
      if (!ytdl.validateURL(url)) {
        await sendMessage( {
          text: "❌ Link YouTube tidak valid!"
        });
        return;
      }

      // Get video info
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const duration = info.videoDetails.lengthSeconds;
      const views = info.videoDetails.viewCount;
      const thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;

      // Send initial message with thumbnail
      await sendMessage( {
        image: {
          url: thumbnail
        },
        caption: `🎵 *${title}*\n\n⏱️ Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}\n👀 Views: ${parseInt(views).toLocaleString()}\n\n⏳ Sedang memproses audio...`
      });

      // Download and send audio
      await downloadAndSendAudio(url, title);
      return;
    }

    if (command === 'ytmp4') {
      const url = args[0];
      // Validate YouTube URL
      if (!ytdl.validateURL(url)) {
        await sendMessage( {
          text: "❌ Link YouTube tidak valid!"
        });
        return;
      }

      // Get video info
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const duration = info.videoDetails.lengthSeconds;
      const views = info.videoDetails.viewCount;
      const thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;

      // Send initial message with thumbnail
      await sendMessage( {
        image: {
          url: thumbnail
        },
        caption: `🎥 *${title}*\n\n⏱️ Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}\n👀 Views: ${parseInt(views).toLocaleString()}\n\n⏳ Sedang memproses video...`
      });

      // Download video
      const videoPath = path.join(mediaDir, `${Date.now()}.mp4`);
      const videoStream = ytdl(url, {
        filter: "audioandvideo",
        quality: "highest",
        format: "mp4"
      });

      const fileStream = fs.createWriteStream(videoPath);
      videoStream.pipe(fileStream);

      await new Promise((resolve, reject) => {
        fileStream.on('finish', async () => {
          try {
            // Send video
            await sendMessage( {
              video: fs.readFileSync(videoPath),
              caption: `✅ *Download Complete*\n\n🎥 ${title}`,
              mimetype: "video/mp4"
            });
            fs.unlinkSync(videoPath);
            resolve();
          } catch (error) {
            console.error(chalk.red("Error sending video:"), error);
            await sendMessage( {
              text: "❌ Gagal mengirim video!"
            });
            reject(error);
          }
        });
        fileStream.on('error', (error) => {
          console.error(chalk.red("Error writing video file:"), error);
          reject(error);
        });
      });

    } else if (command === 'ytmp3') {
      const url = args[0];
      // Validate YouTube URL
      if (!ytdl.validateURL(url)) {
        await sendMessage( {
          text: "❌ Link YouTube tidak valid!"
        });
        return;
      }

      // Get video info
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const duration = info.videoDetails.lengthSeconds;
      const views = info.videoDetails.viewCount;
      const thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;

      // Send initial message with thumbnail
      await sendMessage( {
        image: {
          url: thumbnail
        },
        caption: `🎵 *${title}*\n\n⏱️ Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}\n👀 Views: ${parseInt(views).toLocaleString()}\n\n⏳ Sedang memproses audio...`
      });

      // Download and send audio
      await downloadAndSendAudio(url, title);
    }

  } catch (error) {
    console.error(chalk.red("Error in YouTube downloader:"), error);
    await sock.sendMessage(from, {
      text: "❌ Gagal mendownload video/audio YouTube!"
    });
  }
};