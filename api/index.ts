import type { VercelRequest, VercelResponse } from "@vercel/node";
import importHandler from "./recipes/import";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Health check
  if (req.url?.startsWith("/api/health")) {
    return res.status(200).json({ ok: true, ts: new Date().toISOString() });
  }

  // Route to import handler
  if (req.url?.includes("/api/recipes/import")) {
    return importHandler(req, res);
  }

  // Default 404
  return res.status(404).json({ error: "Not found", path: req.url });
}
