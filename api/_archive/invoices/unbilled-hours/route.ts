import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: entries, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      projects (id, name, client_name, default_rate_cents, phase_rates_cents)
    `)
    .is('invoiced_at', null)
    .order('occurred_on', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grouped = entries.reduce((acc: any, entry: any) => {
    const projectId = entry.project_id;
    if (!acc[projectId]) {
      acc[projectId] = {
        project_id: projectId,
        project_name: entry.projects?.name || 'Unknown',
        client_name: entry.projects?.client_name || 'Unknown',
        total_hours: 0,
        total_amount_cents: 0,
        entries: []
      };
    }
    
    const hours = (entry.minutes || 0) / 60;
    const phaseRates = entry.projects?.phase_rates_cents || {};
    const rate = phaseRates[entry.phase_code] ?? entry.projects?.default_rate_cents ?? 0;
    
    acc[projectId].total_hours += hours;
    acc[projectId].total_amount_cents += Math.round(hours * rate);
    acc[projectId].entries.push(entry);
    
    return acc;
  }, {});

  return NextResponse.json(Object.values(grouped));
}