import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TubeRush - Free YouTube Downloader and MP3 Converter",
    template: "%s | TubeRush"
  },
  description:
    "Paste a YouTube URL to preview thumbnails, choose HD MP4 formats, or convert permitted videos to MP3.",
  keywords: ["Free YouTube Downloader", "Download YouTube Video", "YouTube MP3 Converter", "HD Video Downloader"],
  metadataBase: new URL("https://tuberush.example.com"),
  openGraph: {
    title: "TubeRush - Fast YouTube Downloader",
    description: "Download permitted YouTube videos and audio with a fast, mobile-friendly tool.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
