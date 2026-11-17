
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // PWA configuration
    VitePWA({
      // Prompt-based update avoids unexpectedly reloading
      // pages where users may have unsaved form data.
      registerType: "prompt",

      includeAssets: [
        "icons/apple-touch-icon.png",
        "icons/favicon-48.png",
      ],

      manifest: {
        id: "/",
        name: "Amrit Jal - Water Supply Management",
        short_name: "Amrit Jal",
        description:
          "Manage customers, deliveries, payments, invoices and water supply operations with Amrit Jal.",

        start_url: "/dashboard",
        scope: "/",
        display: "standalone",
        orientation: "any",

        background_color: "#F8FAFC",
        theme_color: "#0F766E",

        categories: ["business", "productivity"],

        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,webp,woff2}",
        ],
        cleanupOutdatedCaches: true,
      },
    }),
  ],

  // EXISTING BUILD OPTIMIZATION — PRESERVED
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20000,

          groups: [
            {
              name: "react-vendor",
              test:
                /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              priority: 30,
            },
            {
              name: "supabase-vendor",
              test: /node_modules[\\/]@supabase[\\/]/,
              priority: 25,
            },
            {
              name: "pdf-vendor",
              test:
                /node_modules[\\/](jspdf|jspdf-autotable|html2canvas)[\\/]/,
              priority: 20,
            },
            {
              name: "spreadsheet-vendor",
              test: /node_modules[\\/](xlsx|papaparse)[\\/]/,
              priority: 20,
            },
            {
              name: "qr-vendor",
              test: /node_modules[\\/]qrcode[\\/]/,
              priority: 20,
            },
            {
              name: "icons-vendor",
              test: /node_modules[\\/]lucide-react[\\/]/,
              priority: 15,
            },
            {
              name: "vendor",
              test: /node_modules[\\/]/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
});
