// Vercel Serverless Function — server-side proxy for Google reviews.
//
// The Google API key NEVER reaches the browser. Configure it (and the place id)
// as ENVIRONMENT VARIABLES in Vercel — NOT in site.json, NOT with a VITE_ prefix:
//   Vercel → Project → Settings → Environment Variables
//     GOOGLE_PLACES_API_KEY = your_server_key
//     GOOGLE_PLACE_ID       = ChIJ........
//
// Harden the key in Google Cloud: restrict to "Places API" only and set a
// daily quota/budget cap. (An IP/referrer restriction is optional here because
// the key is only ever used from Vercel's servers, never the client.)
//
// The browser calls same-origin `/api/reviews`; only public, length-clamped
// review data is returned. Edge-cached to protect the quota from abuse.

export default async function handler(_req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // Not configured yet → empty payload so the client shows its fallback.
  if (!key || !placeId) {
    return res.status(200).json({ reviews: [], rating: null, total: null });
  }

  try {
    const url =
      "https://maps.googleapis.com/maps/api/place/details/json" +
      `?place_id=${encodeURIComponent(placeId)}` +
      "&fields=reviews,rating,user_ratings_total" +
      "&reviews_no_translations=true&language=es" +
      `&key=${encodeURIComponent(key)}`;

    const resp = await fetch(url);
    const data = await resp.json();

    if (data.status !== "OK" || !data.result) {
      return res.status(200).json({ reviews: [], rating: null, total: null });
    }

    const reviews = (data.result.reviews || []).slice(0, 6).map((r) => ({
      author: String(r.author_name || "").slice(0, 80),
      rating: Number(r.rating) || 0,
      text: String(r.text || "").slice(0, 600),
      date: String(r.relative_time_description || "").slice(0, 40),
    }));

    return res.status(200).json({
      reviews,
      rating: data.result.rating ?? null,
      total: data.result.user_ratings_total ?? null,
    });
  } catch {
    return res.status(200).json({ reviews: [], rating: null, total: null });
  }
}
