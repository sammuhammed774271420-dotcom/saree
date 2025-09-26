// server/vite.ts
import { createServer as createViteServer } from 'vite';
import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import { type Server } from 'http';
import { fileURLToPath } from 'url';

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
  try {
    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    };

    // إنشاء Vite server باستخدام الاستيراد الصحيح
    const viteServer = await createViteServer({
      configFile: path.resolve(__dirname, "..", "vite.config.ts"),
      server: serverOptions,
      appType: "custom",
      root: path.resolve(__dirname, ".."),
    });

    app.use(viteServer.middlewares);
    
    app.use("*", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const url = req.originalUrl;
      
      try {
        // البحث عن القالب المناسب بناءً على المسار
        let templatePath: string;
        
        if (url.startsWith('/admin')) {
          templatePath = path.resolve(__dirname, "..", "admin", "index.html");
        } else if (url.startsWith('/delivery')) {
          templatePath = path.resolve(__dirname, "..", "delivery", "index.html");
        } else {
          templatePath = path.resolve(__dirname, "..", "client", "index.html");
        }

        if (!fs.existsSync(templatePath)) {
          return next();
        }

        let template = await fs.promises.readFile(templatePath, "utf-8");
        const page = await viteServer.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (error) {
        next(error);
      }
    });
    
  } catch (error) {
    console.error('Error setting up Vite:', error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // خدمة الملفات الثابتة لكل التطبيقات
  app.use(express.static(path.join(distPath, 'client')));
  app.use('/admin', express.static(path.join(distPath, 'admin')));
  app.use('/delivery', express.static(path.join(distPath, 'delivery')));

  // مسارات الfallback
  app.use("*", (req: express.Request, res: express.Response) => {
    let filePath: string;
    
    if (req.originalUrl.startsWith('/admin')) {
      filePath = path.join(distPath, 'admin', 'index.html');
    } else if (req.originalUrl.startsWith('/delivery')) {
      filePath = path.join(distPath, 'delivery', 'index.html');
    } else {
      filePath = path.join(distPath, 'client', 'index.html');
    }
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Page not found');
    }
  });
}
