// server/vite.ts
import * as vite from "vite";
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
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
  // في بيئة الإنتاج، استخدم الملفات الثابتة مباشرة
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
    return;
  }

  const serverOptions = {
    middlewareMode: true,
    hmr: { 
      server,
      port: 5000
    },
    allowedHosts: true,
    host: "0.0.0.0",
    port: 5000,
  };

  try {
    // استيراد vite بشكل ديناميكي لتجنب تحذير الـ import
    const vite = await import("vite");
    
    const viteServer = await vite.createServer({
      configFile: path.resolve(__dirname, "..", "vite.config.ts"),
      server: serverOptions,
      appType: "custom",
      root: path.resolve(__dirname, "..", "client"),
    });

    app.use(viteServer.middlewares);
    
    app.use("*", async (req: any, res: any, next: any) => {
      const url = req.originalUrl;
      
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

    log("Vite development server configured successfully", "vite");
    
  } catch (error) {
    console.error("Error setting up Vite:", error);
    // في حالة الخطأ، استخدم الملفات الثابتة
    serveStatic(app);
  }
}

export function serveStatic(app: Express) {
  // محاولة مسارات مختلفة لملف index.html
  const possiblePaths = [
    path.resolve(__dirname, "..", "dist", "public", "index.html"),
    path.resolve(__dirname, "..", "client", "index.html"),
    path.resolve(__dirname, "..", "client", "index.html"),
    path.resolve(__dirname, "..", "public", "index.html")
  ];

  let distPath = null;
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      distPath = path.dirname(possiblePath);
      break;
    }
  }

  if (!distPath) {
    console.error("Could not find built files in any of the expected locations:");
    possiblePaths.forEach(p => console.error("  - " + p));
    
    // تقديم رسالة خطأ بدلاً من رمي خطأ
    app.use("*", (_req, res) => {
      res.status(500).send(`
        <html>
          <body>
            <h1>Application Error</h1>
            <p>Client files not found. Please build the client first.</p>
            <p>Expected locations:</p>
            <ul>
              ${possiblePaths.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </body>
        </html>
      `);
    });
    return;
  }

  console.log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
  
  // خدمة index.html لجميع المسارات الأخرى
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
