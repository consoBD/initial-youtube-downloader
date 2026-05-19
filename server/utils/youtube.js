const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"]);

function normalizeYouTubeUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Enter a valid YouTube URL.");
  }

  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    throw new Error("Only YouTube URLs are supported.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Unsupported URL protocol.");
  }

  parsed.hash = "";
  return parsed.toString();
}

function sanitizeFilename(name) {
  return String(name || "download")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function compactFormats(formats = []) {
  const seen = new Set();
  return formats
    .filter((format) => format.vcodec && format.vcodec !== "none")
    .map((format) => ({
      formatId: format.format_id,
      label: format.format_note || (format.height ? `${format.height}p` : format.format),
      ext: format.ext,
      filesize: format.filesize || format.filesize_approx,
      fps: format.fps,
      hasAudio: Boolean(format.acodec && format.acodec !== "none")
    }))
    .filter((format) => {
      const key = `${format.label}-${format.ext}-${format.hasAudio}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 24);
}

module.exports = {
  compactFormats,
  normalizeYouTubeUrl,
  sanitizeFilename
};
