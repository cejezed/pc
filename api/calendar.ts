import type { VercelRequest, VercelResponse } from "@vercel/node";
// @ts-ignore - node-ical types kunnen ontbreken
import ical from "node-ical";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const ICS_URL = process.env.GOOGLE_CALENDAR_ICS_URL;
    if (!ICS_URL) {
      return res.status(500).json({ error: "GOOGLE_CALENDAR_ICS_URL not configured" });
    }

    // Query params voor window
    const limitParam = req.query.limit as string;
    const startParam = req.query.start as string;
    const endParam = req.query.end as string;

    const limit = limitParam ? parseInt(limitParam) : 20;
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // -1 dag
    const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 dagen

    const startDate = startParam ? new Date(startParam) : defaultStart;
    const endDate = endParam ? new Date(endParam) : defaultEnd;

    // Fetch ICS
    const events = await ical.async.fromURL(ICS_URL);
    
    const parsedEvents: CalendarEvent[] = [];

    for (const k in events) {
      const ev = events[k];
      if (ev.type !== "VEVENT") continue;

      const start = ev.start ? new Date(ev.start) : null;
      const end = ev.end ? new Date(ev.end) : null;

      if (!start) continue;

      // Filter op window
      if (start < startDate || start > endDate) continue;

      // Detecteer all-day (geen tijd component)
      const allDay = typeof ev.start === "string" && ev.start.length === 8; // YYYYMMDD

      parsedEvents.push({
        id: ev.uid || k,
        title: ev.summary || "Geen titel",
        start: start.toISOString(),
        end: end ? end.toISOString() : start.toISOString(),
        allDay,
        location: ev.location,
        description: ev.description,
      });

      if (parsedEvents.length >= limit) break;
    }

    // Sorteer op start tijd
    parsedEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return res.status(200).json(parsedEvents);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Calendar fetch failed" });
  }
}