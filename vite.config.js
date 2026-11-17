
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20000,

          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              priority: 30,
            },
            {
              name: "supabase-vendor",
              test: /node_modules[\\/]@supabase[\\/]/,
              priority: 25,
            },
            {
              name: "pdf-vendor",
              test: /node_modules[\\/](jspdf|jspdf-autotable|html2canvas)[\\/]/,
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
