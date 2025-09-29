import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supaAdmin } from "./_supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supaAdmin
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const payload = Array.isArray(req.body) ? req.body : [req.body];
      const { data, error } = await supaAdmin
        .from("tasks")
        .insert(payload)
        .select();
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const { data, error } = await supaAdmin
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select();
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const { error } = await supaAdmin
        .from("tasks")
        .delete()
        .eq("id", id);
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Unexpected error" });
  }
}