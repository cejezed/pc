import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) {
    return res.status(400).json({ error: 'Missing invoice id' });
  }

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // TODO: Hier kun je email sending toevoegen (Resend, SendGrid, etc.)

  return res.status(200).json({ success: true });
}
