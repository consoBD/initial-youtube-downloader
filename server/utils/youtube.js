const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"]);
const YOUTUBE_URL_PATTERN = /https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/i;

function normalizeYouTubeUrl(rawUrl) {
  const textUrl = String(rawUrl || "").trim();
  const matchedUrl = textUrl.match(YOUTUBE_URL_PATTERN)?.[0] || textUrl;

  let parsed;
  try {
    parsed = new URL(matchedUrl);
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
  parsed.searchParams.delete("si");
  parsed.searchParams.delete("feature");
  return parsed.toString();
}

function getYtDlpOptions(extraOptions = {}) {
  const options = {
    noWarnings: true,
    noPlaylist: true,
    ...extraOptions
  };

  if (process.env.YTDLP_COOKIES_PATH) {
    options.cookies = process.env.YTDLP_COOKIES_PATH;
  }

  return options;
}

function normalizeYtDlpError(error) {
  const message = error?.stderr || error?.message || String(error);

  if (/Sign in to confirm.*not a bot|cookies-from-browser|cookies/i.test(message)) {
    return {
      status: 429,
      message:
        "YouTube is blocking this server with a bot check. Add YouTube cookies to Render as YTDLP_COOKIES, or try a different video/server."
    };
  }

  if (/Unsupported URL|not a valid URL|Unable to extract/i.test(message)) {
    return {
      status: 400,
      message: "This YouTube URL could not be processed. Try a normal youtube.com/watch or youtu.be link."
    };
  }

  return {
    status: 400,
    message: message.split("\n").find(Boolean) || "Unable to process this video."
  };
}

function getVideoId(url) {
  const parsed = new URL(url);
  if (parsed.hostname.toLowerCase() === "youtu.be") {
    return parsed.pathname.split("/").filter(Boolean)[0];
  }

  if (parsed.pathname.startsWith("/shorts/")) {
    return parsed.pathname.split("/").filter(Boolean)[1];
  }

  return parsed.searchParams.get("v");
}

async function getFallbackInfo(url, warning) {
  const videoId = getVideoId(url);
  const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);

  if (!response.ok) {
    throw new Error(warning || "Unable to fetch video preview.");
  }

  const data = await response.json();

  return {
    title: data.title || "YouTube video",
    thumbnail: data.thumbnail_url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ""),
    duration: undefined,
    webpageUrl: url,
    formats: [],
    downloadable: false,
    warning:
      warning ||
      "Preview loaded, but downloads are unavailable from this server without YouTube cookies."
  };
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
  getFallbackInfo,
  getYtDlpOptions,
  normalizeYouTubeUrl,
  normalizeYtDlpError,
  sanitizeFilename
};
