﻿import type { VercelRequest, VercelResponse } from "@vercel/node";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.url?.startsWith("/api/health")) {
    return res.status(200).json({ ok: true, ts: new Date().toISOString() });
  }
  return res.status(404).json({ error: "Not found" });
}
