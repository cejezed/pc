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
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: Hier kun je email sending toevoegen (Resend, SendGrid, etc.)
  
  return NextResponse.json({ success: true });
}