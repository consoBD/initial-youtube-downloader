const fs = require("fs");
const os = require("os");
const path = require("path");

function setupCookiesFromEnv() {
  const rawCookies = process.env.YTDLP_COOKIES;
  if (!rawCookies || process.env.YTDLP_COOKIES_PATH) return;

  const cookiesPath = path.join(os.tmpdir(), "youtube-cookies.txt");
  const normalizedCookies = rawCookies.replace(/\\n/g, "\n");
  fs.writeFileSync(cookiesPath, normalizedCookies, { mode: 0o600 });
  process.env.YTDLP_COOKIES_PATH = cookiesPath;
}

module.exports = {
  setupCookiesFromEnv
};
