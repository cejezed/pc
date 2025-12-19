import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supaAdmin } from "./_supabase";

const VALID_ENTITIES = [
  "time_entries", "projects", "phases", "workouts", "steps", 
  "energy_checks", "meals", "ideas", "subscriptions", 
  "shopping_items", "tasks"
];

function parseCSV(csv: string): any[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || null;
    });
    rows.push(row);
  }

  return rows;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const entity = req.query.entity as string;
    if (!entity || !VALID_ENTITIES.includes(entity)) {
      return res.status(400).json({ error: `Invalid entity. Must be one of: ${VALID_ENTITIES.join(", ")}` });
    }

    const { csv } = req.body;
    if (!csv || typeof csv !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'csv' field in body" });
    }

    const rows = parseCSV(csv);
    if (rows.length === 0) {
      return res.status(400).json({ error: "No valid rows found in CSV" });
    }

    // Upsert: als 'id' aanwezig, update; anders insert
    const hasId = rows[0].id !== undefined;

    if (hasId) {
      // Upsert per rij (Supabase upsert ondersteunt dit)
      const { data, error } = await supaAdmin
        .from(entity)
        .upsert(rows, { onConflict: "id" })
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ inserted: data?.length || 0, rows: data });
    } else {
      // Bulk insert
      const { data, error } = await supaAdmin
        .from(entity)
        .insert(rows)
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ inserted: data?.length || 0, rows: data });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Import failed" });
  }
}
