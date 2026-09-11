import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PaseSpain",
    short_name: "PaseSpain",
    description: "Fussballtickets in Spanien",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#071426",
    theme_color: "#071426",
    orientation: "portrait-primary",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
