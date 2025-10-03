import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      project:projects(name, client_name),
      items:invoice_items(*)
    `)
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const { error } = await supabase
    .from('invoices')
    .update(body)
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('id', params.id)
    .single();

  if (invoice?.invoice_number) {
    await supabase
      .from('time_entries')
      .update({ 
        invoiced_at: null,
        invoice_number: null 
      })
      .eq('invoice_number', invoice.invoice_number);
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}