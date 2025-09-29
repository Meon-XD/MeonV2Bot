const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

module.exports = async function(sock, chatInfo) {
    const { from, args } = chatInfo;
    
    try {
        const url = args[0];
        
        // Validate TikTok URL
        if (!url.includes('tiktok.com')) {
            await sock.sendMessage(from, { text: "❌ Link TikTok tidak valid!" });
            return;
        }
        
        // Send processing message
        await sock.sendMessage(from, { text: "⏳ Sedang mendownload video TikTok..." });
        
        // Use TikTok API (you can replace with your preferred API)
        const apiUrl = `https://api.tiktokv.com/aweme/v1/feed/?aweme_id=${url.split('/video/')[1]?.split('?')[0]}`;
        
        try {
            const response = await axios.get(apiUrl);
            const data = response.data;
            
            if (data.aweme_list && data.aweme_list.length > 0) {
                const videoData = data.aweme_list[0];
                const videoUrl = videoData.video.play_addr.url_list[0];
                const title = videoData.desc || "TikTok Video";
                
                // Download video
                const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
                const videoBuffer = Buffer.from(videoResponse.data);
                
                // Create media directory if not exists
                const mediaDir = path.join(__dirname, '..', 'media');
                if (!fs.existsSync(mediaDir)) {
                    fs.mkdirSync(mediaDir);
                }
                
                const videoPath = path.join(mediaDir, `${Date.now()}.mp4`);
                fs.writeFileSync(videoPath, videoBuffer);
                
                // Send video
                await sock.sendMessage(from, {
                    video: fs.readFileSync(videoPath),
                    caption: `✅ *TikTok Download Complete*\n\n🎵 ${title}`,
                    mimetype: "video/mp4"
                });
                
                // Delete file
                fs.unlinkSync(videoPath);
                
            } else {
                // Fallback to alternative API
                await downloadFromAlternativeApi(sock, from, url);
            }
            
        } catch (error) {
            console.error(chalk.yellow("Primary TikTok API failed, trying alternative..."));
            await downloadFromAlternativeApi(sock, from, url);
        }
        
    } catch (error) {
        console.error(chalk.red("Error in TikTok downloader:"), error);
        await sock.sendMessage(from, { text: "❌ Gagal mendownload video TikTok!" });
    }
};

// Alternative TikTok download function
async function downloadFromAlternativeApi(sock, from, url) {
    try {
        // Use alternative API (you can replace with your preferred API)
        const alternativeApi = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
        const response = await axios.get(alternativeApi);
        const data = response.data;
        
        if (data.data && data.data.play) {
            const videoUrl = data.data.play;
            const title = data.data.title || "TikTok Video";
            
            // Download video
            const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(videoResponse.data);
            
            // Create media directory if not exists
            const mediaDir = path.join(__dirname, '..', 'media');
            if (!fs.existsSync(mediaDir)) {
                fs.mkdirSync(mediaDir);
            }
            
            const videoPath = path.join(mediaDir, `${Date.now()}.mp4`);
            fs.writeFileSync(videoPath, videoBuffer);
            
            // Send video
            await sock.sendMessage(from, {
                video: fs.readFileSync(videoPath),
                caption: `✅ *TikTok Download Complete*\n\n🎵 ${title}`,
                mimetype: "video/mp4"
            });
            
            // Delete file
            fs.unlinkSync(videoPath);
            
        } else {
            throw new Error("No video data found");
        }
        
    } catch (error) {
        console.error(chalk.red("Alternative TikTok API failed:"), error);
        await sock.sendMessage(from, { text: "❌ Gagal mendownload video TikTok! Silakan coba lagi nanti." });
    }
}