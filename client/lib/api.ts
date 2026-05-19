import axios from "axios";

export type VideoFormat = {
  formatId: string;
  label: string;
  ext?: string;
  filesize?: number;
  fps?: number;
  hasAudio: boolean;
};

export type VideoInfo = {
  title: string;
  thumbnail: string;
  duration?: number;
  webpageUrl: string;
  formats: VideoFormat[];
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  timeout: 60000
});

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error || error.message;
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function fetchVideoInfo(url: string) {
  const response = await api.post<VideoInfo>("/api/info", { url });
  return response.data;
}

export function getDownloadUrl(url: string, format: string, type: "video" | "audio" = "video") {
  const params = new URLSearchParams({ url, format, type });
  return `${api.defaults.baseURL}/api/download?${params.toString()}`;
}
