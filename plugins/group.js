const chalk = require("chalk");

module.exports = async function(sock, chatInfo) {
    const { from, isGroup, sender, args } = chatInfo;
    
    if (!isGroup) {
        await sock.sendMessage(from, { text: "❌ Command ini hanya bisa digunakan di grup!" });
        return;
    }
    
    try {
        const groupMetadata = await sock.groupMetadata(from);
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botAdmin = groupMetadata.participants.find(p => p.id === botNumber)?.admin;
        const senderAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;
        
        if (!botAdmin) {
            await sock.sendMessage(from, { text: "❌ Bot harus menjadi admin untuk menggunakan command ini!" });
            return;
        }
        
        if (!senderAdmin) {
            await sock.sendMessage(from, { text: "❌ Hanya admin yang bisa menggunakan command ini!" });
            return;
        }
        
        const subCommand = args[0]?.toLowerCase();
        
        switch (subCommand) {
            case "open":
                await sock.groupSettingUpdate(from, "not_announcement");
                await sock.sendMessage(from, { text: "✅ Grup telah dibuka!" });
                break;
                
            case "close":
                await sock.groupSettingUpdate(from, "announcement");
                await sock.sendMessage(from, { text: "✅ Grup telah ditutup!" });
                break;
                
            case "link":
                const inviteCode = await sock.groupInviteCode(from);
                await sock.sendMessage(from, { 
                    text: `🔗 *Link Grup*\n\nhttps://chat.whatsapp.com/${inviteCode}` 
                });
                break;
                
            case "revoke":
                await sock.groupRevokeInvite(from);
                await sock.sendMessage(from, { text: "✅ Link grup telah di-revoke!" });
                break;
                
            case "info":
                const info = `📋 *Info Grup*\n\n` +
                    `📛 *Nama:* ${groupMetadata.subject}\n` +
                    `📝 *Deskripsi:* ${groupMetadata.desc || 'Tidak ada deskripsi'}\n` +
                    `👥 *Total Member:* ${groupMetadata.participants.length}\n` +
                    `👑 *Owner:* ${groupMetadata.owner?.split('@')[0] || 'Unknown'}\n` +
                    `📅 *Dibuat:* ${new Date(groupMetadata.creation * 1000).toLocaleDateString('id-ID')}`;
                await sock.sendMessage(from, { text: info });
                break;
                
            case "promote":
                if (!args[1]) {
                    await sock.sendMessage(from, { text: "❌ Masukkan nomor target!\nContoh: !group promote 6281234567890" });
                    return;
                }
                
                const promoteTarget = args[1] + '@s.whatsapp.net';
                await sock.groupParticipantsUpdate(from, [promoteTarget], "promote");
                await sock.sendMessage(from, { text: `✅ Berhasil promote @${args[1]}!`, mentions: [promoteTarget] });
                break;
                
            case "demote":
                if (!args[1]) {
                    await sock.sendMessage(from, { text: "❌ Masukkan nomor target!\nContoh: !group demote 6281234567890" });
                    return;
                }
                
                const demoteTarget = args[1] + '@s.whatsapp.net';
                await sock.groupParticipantsUpdate(from, [demoteTarget], "demote");
                await sock.sendMessage(from, { text: `✅ Berhasil demote @${args[1]}!`, mentions: [demoteTarget] });
                break;
                
            case "add":
                if (!args[1]) {
                    await sock.sendMessage(from, { text: "❌ Masukkan nomor target!\nContoh: !group add 6281234567890" });
                    return;
                }
                
                const addTarget = args[1] + '@s.whatsapp.net';
                await sock.groupParticipantsUpdate(from, [addTarget], "add");
                await sock.sendMessage(from, { text: `✅ Berhasil menambahkan @${args[1]}!`, mentions: [addTarget] });
                break;
                
            case "kick":
                if (!args[1]) {
                    await sock.sendMessage(from, { text: "❌ Masukkan nomor target!\nContoh: !group kick 6281234567890" });
                    return;
                }
                
                const kickTarget = args[1] + '@s.whatsapp.net';
                await sock.groupParticipantsUpdate(from, [kickTarget], "remove");
                await sock.sendMessage(from, { text: `✅ Berhasil mengeluarkan @${args[1]}!`, mentions: [kickTarget] });
                break;
                
            case "setname":
                if (!args[1]) {
                    await sock.sendMessage(from, { text: "❌ Masukkan nama grup baru!\nContoh: !group setname Nama Grup Baru" });
                    return;
                }
                
                const newName = args.slice(1).join(' ');
                await sock.groupUpdateSubject(from, newName);
                await sock.sendMessage(from, { text: `✅ Nama grup berhasil diubah menjadi "${newName}"!` });
                break;
                
            case "setdesc":
                if (!args[1]) {
                    await sock.sendMessage(from, { text: "❌ Masukkan deskripsi grup baru!\nContoh: !group setdesc Deskripsi Grup Baru" });
                    return;
                }
                
                const newDesc = args.slice(1).join(' ');
                await sock.groupUpdateDescription(from, newDesc);
                await sock.sendMessage(from, { text: `✅ Deskripsi grup berhasil diubah!` });
                break;
                
            default:
                const helpText = `📋 *Group Menu*\n\n` +
                    `🔓 !group open - Buka grup\n` +
                    `🔒 !group close - Tutup grup\n` +
                    `🔗 !group link - Get link grup\n` +
                    `🔄 !group revoke - Revoke link grup\n` +
                    `📋 !group info - Info grup\n` +
                    `⬆️  !group promote <nomor> - Promote member\n` +
                    `⬇️  !group demote <nomor> - Demote admin\n` +
                    `➕ !group add <nomor> - Tambah member\n` +
                    `➖ !group kick <nomor> - Keluarkan member\n` +
                    `📝 !group setname <nama> - Ubah nama grup\n` +
                    `📄 !group setdesc <desc> - Ubah deskripsi grup`;
                
                await sock.sendMessage(from, { text: helpText });
        }
        
    } catch (error) {
        console.error(chalk.red("Error in group command:"), error);
        await sock.sendMessage(from, { text: "❌ Gagal menjalankan command group!" });
    }
};