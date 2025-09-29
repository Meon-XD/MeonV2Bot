const googleIt = require("google-it");
const chalk = require("chalk");

module.exports = async function(sock, chatInfo) {
    const { from, args } = chatInfo;
    
    try {
        const query = args.join(" ");
        
        if (!query) {
            await sock.sendMessage(from, { text: "❌ Masukkan kata kunci pencarian!\nContoh: !google cara membuat bot whatsapp" });
            return;
        }
        
        // Send searching message
        await sock.sendMessage(from, { text: "🔍 Sedang mencari di Google..." });
        
        // Search Google
        const results = await googleIt({ query, limit: 5 });
        
        if (results.length === 0) {
            await sock.sendMessage(from, { text: "❌ Tidak ditemukan hasil pencarian!" });
            return;
        }
        
        // Format results
        let response = `🔍 *Hasil Pencarian Google*\n\n`;
        response += `📝 *Query:* ${query}\n\n`;
        
        results.forEach((result, index) => {
            response += `${index + 1}. *${result.title}*\n`;
            response += `🔗 ${result.link}\n`;
            response += `💬 ${result.snippet.substring(0, 100)}...\n\n`;
        });
        
        response += `📊 *Total Hasil:* ${results.length} hasil\n`;
        response += `🤖 *Powered by ${require('../settings.json').botName}*`;
        
        // Send results
        await sock.sendMessage(from, { text: response });
        
    } catch (error) {
        console.error(chalk.red("Error in Google search:"), error);
        await sock.sendMessage(from, { text: "❌ Gagal melakukan pencarian Google!" });
    }
};