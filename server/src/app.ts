import express from "express";
import cors from "cors";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type PerformOcr = (p: {
  imageBase64: string;
  mimeType: string;
}) => Promise<{ text: string; raw?: unknown }>;

export function createApp(performOcr: PerformOcr) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: true }));
  app.use(compression());
  app.use(express.json({ limit: "6mb" }));

  app.get("/heartbeat", (_req, res) => {
      res.status(200).json({ status: "ok", time: new Date().toISOString() });
  });

  app.post("/api/ocr", async (req, res) => {
    const { imageBase64, mimeType } = req.body ?? {};
    if (typeof imageBase64 !== "string" || typeof mimeType !== "string") {
      return res.status(400).json({ error: "Invalid payload" });
    }
    try {
      const out = await performOcr({ imageBase64, mimeType });
      res.json(out);
    } catch (e) {
      res.status(502).json({ error: (e as Error).message });
    }
  });

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const staticDir = path.join(__dirname, "..", "..", "client-dist");
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => res.sendFile(path.join(staticDir, "index.html")));
  return app;
}
