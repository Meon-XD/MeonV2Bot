const {
  default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
  } = require('@whiskeysockets/baileys');
  const {
    Boom
  } = require('@hapi/boom');
  const P = require('pino');
  const fs = require('fs-extra');
  const path = require('path');
  const chalk = require('chalk'); // Pastikan chalk@4.1.2
  const figlet = require('figlet');
  const moment = require('moment');
  const startBot = require('./bot');
  const readline = require('readline');
  const question = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Validasi dan load settings.json
  let settings;
  try {
    settings = require('./settings.json');
    const requiredFields = ['botName',
      'ownerName',
      'prefix',
      'botNumber'];
    const missingFields = requiredFields.filter(field => !settings[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in settings.json: ${missingFields.join(', ')}`);
    }
    // Validasi format botNumber
    if (!settings.botNumber.match(/^\d+@s\.whatsapp\.net$/)) {
      throw new Error('Invalid botNumber format in settings.json. Use format: 6281234567890@s.whatsapp.net');
    }
  } catch (err) {
    console.error(chalk.red('Error loading settings.json:'), err);
    process.exit(1);
  }

  // Membuat folder auth jika belum ada
  const authDir = path.join(__dirname, 'auth', 'sesi');
  if (!fs.existsSync(authDir)) {
    try {
      fs.mkdirSync(authDir, {
        recursive: true
      });
      console.log(chalk.green('Created auth directory:', authDir));
    } catch (err) {
      console.error(chalk.red('Error creating auth directory:'), err);
      process.exit(1);
    }
  }

  // Fungsi untuk menampilkan banner
  function banner() {
    console.log(chalk.green(figlet.textSync(settings.botName, {
      font: 'Small',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: false,
    })));
    console.log(chalk.cyan('\n\n==================================='));
    console.log(chalk.yellow(`Bot Name: ${settings.botName}`));
    console.log(chalk.yellow(`Owner: ${settings.ownerName}`));
    console.log(chalk.yellow(`Prefix: ${settings.prefix}`));
    console.log(chalk.yellow(`Time: ${moment().format('HH:mm:ss')}`));
    console.log(chalk.cyan('==================================='));
  }

  // Fungsi koneksi bot
  async function connectBot() {
    banner();

    // Inisialisasi state autentikasi
    let state,
    saveCreds;
    try {
      const auth = await useMultiFileAuthState(authDir);
      state = auth.state;
      saveCreds = auth.saveCreds;
      if (typeof saveCreds !== 'function') {
        throw new Error('saveCreds is not a function. Check @whiskeysockets/baileys version compatibility.');
      }
      console.log(chalk.green('Auth state initialized successfully'));
    } catch (err) {
      console.error(chalk.red('Error initializing auth state:'), err);
      process.exit(1);
    }

    // Mengambil versi Baileys terbaru
    let version;
    try {
      version = (await fetchLatestBaileysVersion()).version;
      console.log(chalk.green('Using Baileys version:', version));
    } catch (err) {
      console.error(chalk.red('Error fetching latest Baileys version:'), err);
      version = [2,
        2413,
        1]; // Fallback version
    }

    const sock = makeWASocket( {
      logger: P( {
        level: 'silent'
      }),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, P( {
          level: 'silent'
        })),
      },
      browser: [settings.botName, 'Chrome', '1.0.0'],
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      retryRequestDelayMs: 10,
      connectionTimeoutMs: 30000,
      defaultQueryTimeoutMs: undefined,
      keepAliveIntervalMs: 30000,
      version,
      emitOwnEvents: false,
      patchMessageBeforeSending: (message) => {
        const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
        if (requiresPatch) {
          message = {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadataVersion: 2,
                  deviceListMetadata: {},
                },
                ...message,
              },
            },
          };
        }
        return message;
      },
    });

    // Menangani koneksi dan QR code
    sock.ev.on('connection.update',
      async (update) => {
        const {
          connection,
          lastDisconnect,
          qr,
          isNewLogin
        } = update;

        if (qr && !isNewLogin) {
          console.log(chalk.yellow('📱 QR Code Generated:'), qr);
          // Opsional: Gunakan pustaka qrcode untuk menampilkan QR code dalam format grafis
          try {
            const qrcode = require('qrcode');
            qrcode.toString(qr, {
              type: 'terminal', small: true
            }, (err, url) => {
              if (err) {
                console.error(chalk.red('Error generating QR code in terminal:'), err);
                console.log(chalk.yellow('Please use the QR code text above or scan from another device.'));
              } else {
                console.log(chalk.green('QR Code (scan with WhatsApp):'));
                console.log(url);
              }
            });
          } catch (err) {
            console.log(chalk.yellow('Pustaka qrcode tidak terinstal. Gunakan teks QR code di atas atau instal qrcode dengan: npm install qrcode'));
          }
        }

        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error && (lastDisconnect.error instanceof Boom) && lastDisconnect.error.output?.statusCode !== 401;
          console.log(chalk.red('Connection closed due to:'), lastDisconnect?.error || 'Unknown error', ', reconnecting:', shouldReconnect);

          if (shouldReconnect) {
            setTimeout(() => connectBot(), 5000); // Delay 5 detik sebelum reconnect
          } else {
            console.error(chalk.red('Connection closed with status 401. Please re-authenticate by scanning the QR code.'));
            process.exit(1);
          }
        } else if (connection === 'open') {
          console.log(chalk.green('✅ Connected to WhatsApp'));

          // Set bot profile
          if (settings.botNumber) {
            try {
              await sock.updateProfileName(settings.botName);
              console.log(chalk.green('Bot profile name updated:', settings.botName));
            } catch (err) {
              console.error(chalk.red('Error updating profile name:'), err);
            }
          }
        }
      });

    // Update credentials
    sock.ev.on('creds.update',
      saveCreds);

    // Auto reload bot.js on save
    fs.watchFile(require.resolve('./bot'),
      () => {
        console.log(chalk.yellow('🔁 bot.js reloaded'));
        delete require.cache[require.resolve('./bot')];
        try {
          require('./bot'); // Reload modul
        } catch (err) {
          console.error(chalk.red('Error reloading bot.js:'), err);
        }
      });

    // Handle messages
    sock.ev.on('messages.upsert',
      async ({
        messages
      }) => {
        try {
          const msg = messages[0];
          if (!msg?.message || !msg.key.remoteJid) return;

          const from = msg.key.remoteJid;
          const isGroup = from.endsWith('@g.us');
          const sender = isGroup ? msg.key.participant: msg.key.remoteJid;

          // Skip messages from self if selfBot is disabled
          if (!settings.selfBot && sender === sock.user?.id.split(':')[0] + '@s.whatsapp.net') return;

          // Auto read
          if (settings.autoRead) {
            await sock.readMessages([msg.key]);
          }

          // Process message
          await startBot(sock, msg);
        } catch (err) {
          console.error(chalk.red('Error processing message:'), err);
        }
      });

    // Handle group events
    sock.ev.on('group-participants.update',
      async (update) => {
        try {
          const {
            id,
            participants,
            action
          } = update;

          if (!settings.groupSettings?.welcomeMessage && !settings.groupSettings?.leaveMessage) return;

          const metadata = await sock.groupMetadata(id).catch((err) => {
            console.error(chalk.red('Error fetching group metadata:'), err);
            return null;
          });
          if (!metadata) return;

          const groupName = metadata.subject;

          for (const participant of participants) {
            if (action === 'add' && settings.groupSettings.welcomeMessage) {
              const welcomeMessage = `👋 Selamat datang @${participant.split('@')[0]} di grup *${groupName}*!\n\nSemoga betah ya~`;
              await sock.sendMessage(id, {
                text: welcomeMessage,
                mentions: [participant],
              }).catch((err) => {
                console.error(chalk.red('Error sending welcome message:'), err);
              });
            } else if (action === 'remove' && settings.groupSettings.leaveMessage) {
              const leaveMessage = `👋 Selamat tinggal @${participant.split('@')[0]} dari grup *${groupName}*!\n\nSemoga kita bertemu lagi~`;
              await sock.sendMessage(id, {
                text: leaveMessage,
                mentions: [participant],
              }).catch((err) => {
                console.error(chalk.red('Error sending leave message:'), err);
              });
            }
          }
        } catch (err) {
          console.error(chalk.red('Error processing group event:'), err);
        }
      });

    return sock;
  }

  // Start bot dengan retry mekanisme
  async function startBotWithRetry(retries = 3, delay = 5000) {
    for (let i = 0; i < retries; i++) {
      try {
        await connectBot();
        return; // Jika berhasil, keluar dari fungsi
      } catch (err) {
        console.error(chalk.red(`Error starting bot (attempt ${i + 1}/${retries}):`), err);
        if (i < retries - 1) {
          console.log(chalk.yellow(`Retrying in ${delay / 1000} seconds...`));
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    console.error(chalk.red('Failed to start bot after maximum retries. Exiting...'));
    process.exit(1);
  }

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(chalk.red('Uncaught Exception:'), err);
    process.exit(1);
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (err) => {
    console.error(chalk.red('Unhandled Rejection:'), err);
    process.exit(1);
  });

  // Mulai bot
  startBotWithRetry();