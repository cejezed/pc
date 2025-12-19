import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        project:projects(name, client_name),
        items:invoice_items(*)
      `)
      .order("invoice_date", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const {
      time_entry_ids,
      items,
      invoice_number,
      invoice_date,
      ...invoiceData
    } = req.body;

    const normalizedItems = Array.isArray(items) ? items : [];

    // 1. Bereken totaalbedrag
    const amount_cents = normalizedItems.reduce(
      (sum: number, item: any) => sum + item.amount_cents,
      0
    );

    // 2. Maak factuur aan
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        ...invoiceData,
        invoice_number,
        invoice_date,
        amount_cents,
      })
      .select()
      .single();

    if (invoiceError) {
      return res.status(500).json({ error: invoiceError.message });
    }

    // 3. Voeg invoice items toe
    if (normalizedItems.length > 0) {
      const itemsWithInvoiceId = normalizedItems.map((item: any) => ({
        ...item,
        invoice_id: invoice.id,
      }));

      await supabase.from("invoice_items").insert(itemsWithInvoiceId);
    }

    // 4. Markeer time entries als gefactureerd
    if (Array.isArray(time_entry_ids) && time_entry_ids.length > 0) {
      const { error: updateError } = await supabase
        .from("time_entries")
        .update({
          invoiced_at: invoice_date,
          invoice_number: invoice_number,
        })
        .in("id", time_entry_ids);

      if (updateError) {
        console.error("Failed to mark time entries as invoiced:", updateError);
      }
    }

    return res.status(200).json(invoice);
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
