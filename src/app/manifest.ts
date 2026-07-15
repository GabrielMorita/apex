import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Apex — Sistema Pessoal",
    short_name: "Apex",
    description: "Planeje, execute e acompanhe hábitos, metas, treinos e alimentação em um único sistema.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#14100b",
    theme_color: "#14100b",
    orientation: "portrait",
    lang: "pt-BR",
    categories: ["productivity", "lifestyle", "health"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
