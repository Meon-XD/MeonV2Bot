const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

module.exports = async function(sock, chatInfo) {
    const { from, args } = chatInfo;
    
    try {
        const url = args[0];
        
        // Validate Facebook URL
        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            await sock.sendMessage(from, { text: "❌ Link Facebook tidak valid!" });
            return;
        }
        
        // Send processing message
        await sock.sendMessage(from, { text: "⏳ Sedang mendownload video Facebook..." });
        
        // Use Facebook API (you can replace with your preferred API)
        const apiUrl = `https://api.facebook.com/method/video.get_url?format=json&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662&video_id=${getVideoId(url)}`;
        
        try {
            const response = await axios.get(apiUrl);
            const data = response.data;
            
            if (data && data.play_url_hd) {
                await downloadAndSendVideo(sock, from, data.play_url_hd, "Facebook Video (HD)");
            } else if (data && data.play_url_sd) {
                await downloadAndSendVideo(sock, from, data.play_url_sd, "Facebook Video (SD)");
            } else {
                // Fallback to alternative API
                await downloadFromAlternativeApi(sock, from, url);
            }
            
        } catch (error) {
            console.error(chalk.yellow("Primary Facebook API failed, trying alternative..."));
            await downloadFromAlternativeApi(sock, from, url);
        }
        
    } catch (error) {
        console.error(chalk.red("Error in Facebook downloader:"), error);
        await sock.sendMessage(from, { text: "❌ Gagal mendownload video Facebook!" });
    }
};

// Extract video ID from Facebook URL
function getVideoId(url) {
    const match = url.match(/\/videos\/(\d+)/);
    if (match) return match[1];
    
    const fbWatchMatch = url.match(/fb\.watch\/([^\?\/]+)/);
    if (fbWatchMatch) return fbWatchMatch[1];
    
    return null;
}

// Download and send video
async function downloadAndSendVideo(sock, from, videoUrl, title) {
    try {
        // Download video
        const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
        const videoBuffer = Buffer.from(response.data);
        
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
            caption: `✅ *Facebook Download Complete*\n\n📹 ${title}`,
            mimetype: "video/mp4"
        });
        
        // Delete file
        fs.unlinkSync(videoPath);
        
    } catch (error) {
        console.error(chalk.red("Error downloading/sending video:"), error);
        throw error;
    }
}

// Alternative Facebook download function
async function downloadFromAlternativeApi(sock, from, url) {
    try {
        // Use alternative API (you can replace with your preferred API)
        const alternativeApi = `https://fbdown.net/download.php?url=${encodeURIComponent(url)}`;
        const response = await axios.get(alternativeApi);
        
        // Extract download links from HTML response
        const html = response.data;
        const hdMatch = html.match(/href="(https:\/\/[^"]+)"[^>]*>Download HD<\/a>/);
        const sdMatch = html.match(/href="(https:\/\/[^"]+)"[^>]*>Download SD<\/a>/);
        
        if (hdMatch) {
            await downloadAndSendVideo(sock, from, hdMatch[1], "Facebook Video (HD)");
        } else if (sdMatch) {
            await downloadAndSendVideo(sock, from, sdMatch[1], "Facebook Video (SD)");
        } else {
            throw new Error("No download links found");
        }
        
    } catch (error) {
        console.error(chalk.red("Alternative Facebook API failed:"), error);
        await sock.sendMessage(from, { text: "❌ Gagal mendownload video Facebook! Link mungkin private atau tidak valid." });
    }
}