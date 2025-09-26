// server/vite.ts
import * as vite from "vite";
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
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
    hmr: { server },
    allowedHosts: true,
  };

  // إنشاء Vite server
  const viteServer = await vite.createServer({
    ...viteConfig,
    configFile: path.resolve(__dirname, "..", "vite.config.ts"), // تغيير المسار
    server: serverOptions,
    appType: "custom",
    root: path.resolve(__dirname, ".."), // تغيير المسار إلى المجلد الرئيسي
  });

  app.use(viteServer.middlewares);
  
  app.use("*", async (req: any, res: any, next: any) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "index.html" // تغيير المسار
      );
      
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // استخدام query parameter بدلاً من nanoid للتحكم بال cache
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?t=${Date.now()}"`
      );
      
      const page = await viteServer.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      viteServer.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist"); // تغيير المسار إلى dist
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
