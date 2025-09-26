// server/vite.ts
import * as vite from "vite";
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { 
      server,
      port: 5000 // تأكد من تطابق المنفذ
    },
    allowedHosts: true,
    host: "0.0.0.0",
    port: 5000,
  };

  try {
    // إنشاء Vite server
    const viteServer = await vite.createServer({
      ...viteConfig,
      configFile: false, // استخدام التكوين الممر مباشرة
      server: serverOptions,
      appType: "custom",
      root: path.resolve(__dirname, "..", "client"),
    });

    // إضافة middleware لتحديد أنواع MIME الصحيحة
    app.use((req, res, next) => {
      if (req.url?.endsWith('.ts') || req.url?.endsWith('.tsx')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
      next();
    });

    app.use(viteServer.middlewares);
    
    app.use("*", async (req: any, res: any, next: any) => {
      const url = req.originalUrl;
      
      // تجاهل طلبات الـ assets و API
      if (url.startsWith('/src/') || url.startsWith('/@id/') || url.startsWith('/@vite/') || url.startsWith('/api/')) {
        return next();
      }

      try {
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html"
        );
        
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        
        const page = await viteServer.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        if (viteServer.ssrFixStacktrace) {
          viteServer.ssrFixStacktrace(e as Error);
        }
        next(e);
      }
    });

    log("Vite server configured successfully", "vite");
    
  } catch (error) {
    console.error("Error setting up Vite:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
