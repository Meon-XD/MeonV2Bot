const chalk = require("chalk");

module.exports = async function(sock, chatInfo) {
    const { from, isGroup, sender, msg } = chatInfo;
    
    if (!isGroup) {
        await sock.sendMessage(from, { text: "❌ Command ini hanya bisa digunakan di grup!" });
        return;
    }
    
    try {
        // Get group metadata
        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants.map(p => p.id);
        
        // Get message content
        const message = msg.message.extendedTextMessage?.text || "";
        const tagMessage = message.replace(/^!tagall\s*/, '') || "👋 *Tag All Member*";
        
        // Send tagall message
        await sock.sendMessage(from, {
            text: tagMessage,
            mentions: participants
        });
        
    } catch (error) {
        console.error(chalk.red("Error in tagall:"), error);
        await sock.sendMessage(from, { text: "❌ Gagal melakukan tagall!" });
    }
};