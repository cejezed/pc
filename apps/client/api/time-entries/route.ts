import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      project:projects(name, client_name),
      items:invoice_items(*)
    `)
    .order('invoice_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { 
    time_entry_ids, 
    items, 
    invoice_number,
    invoice_date,
    ...invoiceData 
  } = body;

  // 1. Bereken totaalbedrag
  const amount_cents = items.reduce((sum: number, item: any) => 
    sum + item.amount_cents, 0
  );

  // 2. Maak factuur aan
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      ...invoiceData,
      invoice_number,
      invoice_date,
      amount_cents
    })
    .select()
    .single();

  if (invoiceError) {
    return NextResponse.json({ error: invoiceError.message }, { status: 500 });
  }

  // 3. Voeg invoice items toe
  if (items?.length > 0) {
    const itemsWithInvoiceId = items.map((item: any) => ({
      ...item,
      invoice_id: invoice.id
    }));

    await supabase.from('invoice_items').insert(itemsWithInvoiceId);
  }

  // 4. ✅ NIEUW: Markeer time entries als gefactureerd
  if (time_entry_ids?.length > 0) {
    const { error: updateError } = await supabase
      .from('time_entries')
      .update({ 
        invoiced_at: invoice_date,
        invoice_number: invoice_number 
      })
      .in('id', time_entry_ids);

    if (updateError) {
      console.error('Failed to mark time entries as invoiced:', updateError);
    }
  }

  return NextResponse.json(invoice);
}