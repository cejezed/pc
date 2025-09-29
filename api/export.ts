import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supaAdmin } from "./_supabase";

const VALID_ENTITIES = [
  "time_entries", "projects", "phases", "workouts", "steps", 
  "energy_checks", "meals", "ideas", "subscriptions", 
  "shopping_items", "tasks"
];

function toCSV(data: any[]): string {
  if (!data || data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  );

  return [
    headers.map(h => `"${h}"`).join(","),
    ...rows
  ].join("\n");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const entity = req.query.entity as string;
    if (!entity || !VALID_ENTITIES.includes(entity)) {
      return res.status(400).json({ error: `Invalid entity. Must be one of: ${VALID_ENTITIES.join(", ")}` });
    }

    // Roadmap: filters via query params (from, to, project_id, etc.)
    const { data, error } = await supaAdmin
      .from(entity)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const csv = toCSV(data || []);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${entity}_export.csv"`);
    return res.status(200).send(csv);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Export failed" });
  }
}