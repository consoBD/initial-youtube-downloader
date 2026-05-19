const express = require("express");
const { execFileSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const youtubedl = require("yt-dlp-exec");
const { compactFormats, normalizeYouTubeUrl, sanitizeFilename } = require("../utils/youtube");

const router = express.Router();

function hasFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

router.post("/info", async (req, res) => {
  try {
    const url = normalizeYouTubeUrl(req.body?.url);
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      noPlaylist: true
    });

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      webpageUrl: info.webpage_url || url,
      formats: compactFormats(info.formats)
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "Unable to fetch video info." });
  }
});

router.get("/download", async (req, res) => {
  let outputPath;

  try {
    const url = normalizeYouTubeUrl(req.query.url);
    const type = req.query.type === "audio" ? "audio" : "video";
    const format = typeof req.query.format === "string" ? req.query.format : "best";

    if (type === "audio" && !hasFfmpeg()) {
      return res.status(503).json({
        error: "MP3 conversion needs FFmpeg installed on the server PATH."
      });
    }

    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noPlaylist: true
    });

    const safeTitle = sanitizeFilename(info.title);
    const tempId = `tuberush-${crypto.randomUUID()}`;
    const outputTemplate = path.join(os.tmpdir(), `${tempId}.%(ext)s`);
    const options =
      type === "audio"
        ? {
            extractAudio: true,
            audioFormat: "mp3",
            audioQuality: 0,
            output: outputTemplate
          }
        : {
            format,
            output: outputTemplate
          };

    await youtubedl(url, {
      ...options,
      noWarnings: true,
      noPlaylist: true
    });

    const files = await fsp.readdir(os.tmpdir());
    const downloadedFile = files.find((file) => file.startsWith(`${tempId}.`));
    if (!downloadedFile) {
      return res.status(502).json({ error: "yt-dlp did not create a downloadable file." });
    }

    outputPath = path.join(os.tmpdir(), downloadedFile);
    const ext = path.extname(outputPath).slice(1) || (type === "audio" ? "mp3" : "mp4");
    const contentType = type === "audio" ? "audio/mpeg" : ext === "webm" ? "video/webm" : "video/mp4";

    res.setHeader("Content-Type", contentType);
    res.download(outputPath, `${safeTitle}.${type === "audio" ? "mp3" : ext}`, async (error) => {
      try {
        if (outputPath && fs.existsSync(outputPath)) await fsp.unlink(outputPath);
      } catch (cleanupError) {
        console.error(cleanupError);
      }

      if (error && !res.headersSent) {
        res.status(500).json({ error: "Could not send the downloaded file." });
      }
    });
  } catch (error) {
    if (outputPath && fs.existsSync(outputPath)) await fsp.unlink(outputPath).catch(() => {});
    if (!res.headersSent) res.status(400).json({ error: error.message || "Download failed." });
  }
});

module.exports = router;
