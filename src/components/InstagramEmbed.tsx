import { useEffect } from "react";

const EMBED_SRC = "https://www.instagram.com/embed.js";

interface InstgrmWindow extends Window {
  instgrm?: { Embeds: { process: () => void } };
}

let loader: Promise<void> | null = null;

/** Load Instagram's official embed.js exactly once. */
function loadEmbedScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as InstgrmWindow;
  if (w.instgrm) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${EMBED_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = EMBED_SRC;
    s.async = true;
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
  return loader;
}

/** Renders one official Instagram reel/post embed by permalink. */
export function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    let active = true;
    void loadEmbedScript().then(() => {
      const w = window as InstgrmWindow;
      if (active && w.instgrm) w.instgrm.Embeds.process();
    });
    return () => {
      active = false;
    };
  }, [url]);

  return (
    <blockquote
      className="instagram-media w-full"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{
        background: "hsl(26 14% 7%)",
        border: 0,
        borderRadius: 4,
        margin: 0,
        padding: 0,
        width: "100%",
      }}
    />
  );
}
