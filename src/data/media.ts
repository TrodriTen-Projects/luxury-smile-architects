export const REEL_VIDEOS = Array.from(
  { length: 12 },
  (_, i) => `/media/video/reel-${String(i + 1).padStart(2, "0")}.mp4`,
);

export const VIDEO_POSTER = "/media/images/smile-03.jpg";
