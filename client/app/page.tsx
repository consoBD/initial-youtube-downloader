"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  Check,
  Clipboard,
  Clock3,
  Download,
  FileAudio,
  ImageDown,
  Link2,
  Loader2,
  Music2,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchVideoInfo, getApiErrorMessage, getDownloadUrl, type VideoInfo } from "@/lib/api";
import { formatDuration } from "@/lib/utils";

const qualityOptions = [
  { label: "360p", format: "best[ext=mp4][height<=360]/best[height<=360]", hint: "Small file" },
  { label: "720p", format: "best[ext=mp4][height<=720]/best[height<=720]", hint: "Balanced HD" },
  { label: "1080p", format: "best[ext=mp4][height<=1080]/best[height<=1080]", hint: "Full HD" }
];

const features: Array<[string, string, LucideIcon]> = [
  ["Fast previews", "Fetch titles, duration, thumbnails, and available formats before download.", Zap],
  ["Audio conversion", "Create MP3 files from content you own or have permission to use.", Music2],
  ["Shorts ready", "Works with standard YouTube links, youtu.be URLs, and Shorts links.", Sparkles],
  ["Built-in guardrails", "Rate limiting, YouTube-only validation, and permission reminders included.", ShieldCheck]
];

const faqs = [
  ["Can I download any YouTube video?", "Use TubeRush only for videos you own, created, or have permission to download."],
  ["Why does MP3 need FFmpeg?", "yt-dlp extracts the media and FFmpeg performs the audio conversion on your server."],
  ["Can this be deployed for free?", "Yes. Put the client on Vercel and the API on Render or Railway free tiers while testing."],
  ["Does it support playlists?", "The starter blocks playlists by default to reduce abuse and server load. You can add a queue later."]
];

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [recent, setRecent] = useState<VideoInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("tuberush-recent");
    if (raw) setRecent(JSON.parse(raw));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedUrl = String(formData.get("url") || inputRef.current?.value || "").trim();

    if (submittedUrl.length < 8) {
      setToast("Paste a YouTube URL first.");
      inputRef.current?.focus();
      return;
    }

    setVideoUrl(submittedUrl);
    setLoading(true);
    setToast("");
    try {
      const data = await fetchVideoInfo(submittedUrl);
      setInfo(data);
      const nextRecent = [data, ...recent.filter((item) => item.webpageUrl !== data.webpageUrl)].slice(0, 4);
      setRecent(nextRecent);
      localStorage.setItem("tuberush-recent", JSON.stringify(nextRecent));
      setToast(data.warning || "Preview ready");
    } catch (error) {
      setToast(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function pasteFromClipboard() {
    inputRef.current?.focus();

    try {
      const pastedUrl = (await navigator.clipboard.readText()).trim();
      if (!pastedUrl) {
        setToast("Clipboard is empty.");
        return;
      }

      setVideoUrl(pastedUrl);
      if (inputRef.current) inputRef.current.value = pastedUrl;
      setToast("URL pasted");
    } catch {
      setToast("Clipboard permission was blocked. Press Ctrl+V in the URL box.");
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedUrl = event.clipboardData.getData("text").trim();
    if (pastedUrl) {
      setVideoUrl(pastedUrl);
      setToast("URL pasted");
    }
  }

  function openDownload(format: string, type: "video" | "audio" = "video") {
    if (!videoUrl) return;
    if (info?.downloadable === false) {
      setToast(info.warning || "Downloads are unavailable for this video on the current server.");
      return;
    }
    window.open(getDownloadUrl(videoUrl, format, type), "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="grid-overlay absolute inset-0 -z-10 opacity-40" />
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-sky-400 text-slate-950">
            <ArrowDownToLine size={20} />
          </span>
          TubeRush
        </Link>
        <div className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
          <Link href="/youtube-downloader">YouTube</Link>
          <Link href="/mp3-converter">MP3</Link>
          <Link href="/shorts-downloader">Shorts</Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-86px)] w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/12 bg-white/8 px-3 py-2 text-sm text-sky-100">
            <Sparkles size={16} /> Free media toolkit starter
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-white sm:text-6xl">
            Free YouTube Downloader and MP3 Converter
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Paste a YouTube link, preview the video, choose an HD format, or extract MP3 audio from content you have permission to download.
          </p>

          <form onSubmit={handleSubmit} className="glass mt-8 rounded-lg p-3 shadow-glow">
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="relative flex-1">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  ref={inputRef}
                  name="url"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  onInput={(event) => setVideoUrl(event.currentTarget.value)}
                  onPaste={handlePaste}
                  placeholder="Paste YouTube URL"
                  className="h-14 w-full rounded-md border border-white/10 bg-white pl-12 pr-4 text-base text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-sky-300"
                />
              </label>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="icon" onClick={pasteFromClipboard} aria-label="Paste URL">
                  <Clipboard size={19} />
                </Button>
                <Button type="submit" disabled={loading} className="min-w-32">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                  Analyze
                </Button>
              </div>
            </div>
            {toast && <p className="px-1 pt-3 text-sm text-sky-100">{toast}</p>}
          </form>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
            {["MP4 downloads", "MP3 extraction", "Thumbnail saver", "Mobile ready"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-md bg-white/8 px-3 py-2">
                <Check size={15} className="text-emerald-300" /> {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.12 }} className="glass rounded-lg p-4">
          <div className="relative aspect-video overflow-hidden rounded-md bg-slate-900">
            {info?.thumbnail ? (
              <Image src={info.thumbnail} alt={info.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 560px" priority />
            ) : (
              <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#102033,#0f766e)]">
                <Download size={64} className="text-white/80" />
              </div>
            )}
          </div>
          <div className="pt-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-200">Video preview</p>
            <h2 className="mt-2 line-clamp-2 text-2xl font-bold text-white">{info?.title || "Your selected video appears here"}</h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <Clock3 size={16} /> {formatDuration(info?.duration)}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {qualityOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => openDownload(option.format)}
                disabled={!info || info.downloadable === false}
                className="rounded-md border border-white/12 bg-white/8 p-4 text-left transition hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="block text-lg font-bold text-white">{option.label}</span>
                <span className="text-sm text-slate-300">{option.hint}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Button disabled={!info || info.downloadable === false} onClick={() => openDownload("bestaudio/best", "audio")} variant="secondary">
              <FileAudio size={18} /> Download MP3
            </Button>
            <Button disabled={!info} onClick={() => info?.thumbnail && window.open(info.thumbnail, "_blank")} variant="secondary">
              <ImageDown size={18} /> Thumbnail
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="border-y border-white/10 bg-black/18 py-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-4">
          {features.map(([title, body, Icon]) => (
            <div key={title} className="rounded-lg border border-white/10 bg-white/6 p-5">
              <Icon className="text-sky-300" size={24} />
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-200">Recent downloads</p>
          <h2 className="mt-2 text-3xl font-black">Viral-ready utility pages and repeat use loops</h2>
        </div>
        <div className="grid gap-3">
          {recent.length ? (
            recent.map((item) => (
              <button key={item.webpageUrl} onClick={() => setVideoUrl(item.webpageUrl)} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/6 p-3 text-left">
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-slate-900">
                  <Image src={item.thumbnail} alt="" fill className="object-cover" sizes="112px" />
                </div>
                <span className="line-clamp-2 font-semibold">{item.title}</span>
              </button>
            ))
          ) : (
            <p className="rounded-lg border border-white/10 bg-white/6 p-5 text-slate-300">Analyzed videos will appear here on this device.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <h2 className="text-3xl font-black">FAQ</h2>
        <div className="mt-6 divide-y divide-white/10 rounded-lg border border-white/10 bg-white/6">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group p-5">
              <summary className="cursor-pointer list-none font-bold">{question}</summary>
              <p className="mt-3 text-slate-300">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-slate-400">
        TubeRush is for content you own or have permission to download. Respect creators, copyright, and platform terms.
      </footer>
    </main>
  );
}
