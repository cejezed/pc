import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Haal originele factuur op
  const { data: original, error: fetchError } = await supabase
    .from('invoices')
    .select(`
      *,
      items:invoice_items(*)
    `)
    .eq('id', params.id)
    .single();

  if (fetchError || !original) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Maak creditnota (negatieve bedragen)
  const { data: creditNote, error: insertError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: `CN-${original.invoice_number}`,
      project_id: original.project_id,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      amount_cents: -original.amount_cents,
      status: 'draft',
      notes: `Creditnota voor factuur ${original.invoice_number}`,
      vat_percent: original.vat_percent,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Kopieer items (met negatieve bedragen)
  if (original.items?.length > 0) {
    const creditItems = original.items.map((item: any) => ({
      invoice_id: creditNote.id,
      description: item.description,
      quantity: -item.quantity,
      rate_cents: item.rate_cents,
      amount_cents: -item.amount_cents,
    }));

    await supabase.from('invoice_items').insert(creditItems);
  }

  return NextResponse.json(creditNote);
}