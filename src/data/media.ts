// Real curated assets from the clinic (see scripts/curate-assets.mjs).

export const REEL_VIDEOS = Array.from(
  { length: 12 },
  (_, i) => `/media/video/reel-${String(i + 1).padStart(2, "0")}.mp4`,
);

export const VIDEO_POSTER = "/media/images/smile-03.jpg";

export const SMILES = [
  "/media/images/smile-01.jpg",
  "/media/images/smile-02.jpg",
  "/media/images/smile-03.jpg",
  "/media/images/smile-04.jpg",
  "/media/images/smile-05.jpg",
];

export const PORTRAIT = "/media/images/portrait-01.jpg";
export const ORTHO = ["/media/images/ortho-01.jpg", "/media/images/ortho-02.jpg"];

// Interactive before/after (real case, split into aligned halves).
export const BEFORE_AFTER = {
  before: "/media/results/veneers-before.jpg",
  after: "/media/results/veneers-after.jpg",
};

// Composed before/after marketing cases (shown as a gallery).
export const CASE_IMAGES = [
  { id: "veneers", src: "/media/images/case-veneers.jpg" },
  { id: "implant", src: "/media/images/case-implant.jpg" },
  { id: "financiacion", src: "/media/images/case-financiacion.jpg" },
];

// Maps each treatment id to a representative photo for cards/modals.
export const TREATMENT_IMAGE: Record<string, string> = {
  resina: "/media/images/smile-02.jpg",
  porcelana: "/media/images/smile-01.jpg",
  mantenimiento: "/media/images/smile-04.jpg",
  reparacion: "/media/images/case-implant.jpg",
  blanqueamiento: "/media/images/smile-05.jpg",
  valoracion: "/media/images/smile-03.jpg",
};
