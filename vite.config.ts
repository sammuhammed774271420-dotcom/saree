import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async () => {
  const plugins = [react()];

  // إضافة plugins الخاصة بـ Replit فقط في بيئة التطوير على Replit
  if (process.env.NODE_ENV !== "production") {
    try {
      // محاولة استيراد plugins الخاصة بـ Replit فقط إذا كانت متوفرة
      if (process.env.REPL_ID) {
        const { cartographer } = await import("@replit/vite-plugin-cartographer");
        plugins.push(cartographer());
        
        // إضافة runtime error overlay فقط على Replit
        const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
        plugins.push(runtimeErrorOverlay.default());
      }
    } catch (error) {
      // تجاهل الخطأ إذا لم تكن الحزم متوفرة (في بيئة Production)
      console.log('Replit plugins not available in production');
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
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
      hmr: {
        port: 5000,
      },
      fs: {
        strict: false,
      },
    },
  };
});
