import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  const plugins = [react()];

  // إضافة plugins الخاصة بـ Replit فقط في بيئة التطوير على Replit
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID) {
    try {
      // محاولة استيراد plugins الخاصة بـ Replit فقط إذا كانت متوفرة
      const cartographer = require("@replit/vite-plugin-cartographer").cartographer;
      plugins.push(cartographer());
      
      // إضافة runtime error overlay فقط على Replit
      const runtimeErrorOverlay = require("@replit/vite-plugin-runtime-error-modal").default;
      plugins.push(runtimeErrorOverlay());
    } catch (error) {
      // تجاهل الخطأ إذا لم تكن الحزم متوفرة (في بيئة Production)
      console.log('Replit plugins not available');
    }
  }

  return {
    plugins,
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    publicDir: path.resolve(__dirname, "client", "public"),
    optimizeDeps: {
      include: ['react', 'react-dom', 'wouter', '@tanstack/react-query'],
      exclude: ['@replit/vite-plugin-cartographer', '@replit/vite-plugin-runtime-error-modal']
    },
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      target: 'es2020',
      minify: 'esbuild',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "client", "index.html"),
        },
        output: {
          format: 'es',
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0].toString();
            }
          }
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: false,
      cors: true,
      hmr: {
        port: 5000,
        host: 'localhost'
      },
      fs: {
        strict: false,
        allow: ['..']
      },
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin'
      }
    },
  };
});
