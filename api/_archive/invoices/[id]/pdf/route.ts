import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EUR = (cents: number) => new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR'
}).format(cents / 100);

const formatDate = (dateString: string) => {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch invoice with all related data
    const { data: invoice, error } = await supabase
      .from('facturen')
      .select(`
        *,
        project:projects(name, client_name, city),
        items:factuur_items(*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate totals
    const subtotal = invoice.items?.reduce((sum: number, item: any) => sum + (item.amount_cents || 0), 0) || 0;
    const vat = Math.round(subtotal * (invoice.vat_percent / 100));
    const total = subtotal + vat;

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factuur ${invoice.invoice_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }

    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 60px;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
    }

    .company-info h1 {
      font-size: 28px;
      margin-bottom: 8px;
      font-weight: 700;
    }

    .company-info p {
      color: #666;
      font-size: 14px;
    }

    .invoice-meta {
      text-align: right;
    }

    .invoice-meta h2 {
      font-size: 24px;
      margin-bottom: 12px;
    }

    .invoice-meta p {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .invoice-meta strong {
      color: #000;
    }

    .addresses {
      display: flex;
      justify-content: space-between;
      margin-bottom: 50px;
    }

    .address-block {
      flex: 1;
    }

    .address-block h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .address-block p {
      font-size: 14px;
      margin-bottom: 3px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    thead {
      background-color: #f5f5f5;
    }

    th {
      text-align: left;
      padding: 12px;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      color: #666;
      border-bottom: 2px solid #ddd;
    }

    th:last-child,
    td:last-child {
      text-align: right;
    }

    tbody tr {
      border-bottom: 1px solid #eee;
    }

    tbody tr:hover {
      background-color: #fafafa;
    }

    td {
      padding: 14px 12px;
      font-size: 14px;
    }

    .description {
      color: #1a1a1a;
    }

    .quantity {
      color: #666;
    }

    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 20px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 14px;
    }

    .totals-row.subtotal {
      border-top: 1px solid #ddd;
    }

    .totals-row.vat {
      color: #666;
    }

    .totals-row.total {
      border-top: 2px solid #000;
      font-weight: 700;
      font-size: 18px;
      margin-top: 8px;
      padding-top: 12px;
    }

    .notes {
      margin-top: 40px;
      padding: 20px;
      background-color: #f9f9f9;
      border-left: 4px solid #000;
    }

    .notes h3 {
      font-size: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .notes p {
      font-size: 14px;
      color: #666;
      white-space: pre-wrap;
    }

    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #999;
      font-size: 12px;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #000;
      color: #fff;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .print-button:hover {
      background: #333;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Afdrukken / Opslaan als PDF</button>

  <div class="header">
    <div class="company-info">
      <h1>Brikx Architectuur</h1>
      <p>Architectenbureau</p>
    </div>
    <div class="invoice-meta">
      <h2>FACTUUR</h2>
      <p><strong>Nummer:</strong> ${invoice.invoice_number}</p>
      <p><strong>Datum:</strong> ${formatDate(invoice.invoice_date)}</p>
      <p><strong>Vervaldatum:</strong> ${formatDate(invoice.due_date)}</p>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h3>Gefactureerd aan</h3>
      <p><strong>${invoice.project?.client_name || 'Klant'}</strong></p>
      <p>${invoice.project?.name || ''}</p>
      ${invoice.project?.city ? `<p>${invoice.project.city}</p>` : ''}
    </div>
    <div class="address-block">
      <h3>Betalingsvoorwaarden</h3>
      <p>${invoice.payment_terms} dagen</p>
      <p>Betaling via bankoverschrijving</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Omschrijving</th>
        <th style="text-align: right;">Aantal</th>
        <th style="text-align: right;">Tarief</th>
        <th style="text-align: right;">Bedrag</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items?.map((item: any) => `
        <tr>
          <td class="description">${item.description}</td>
          <td class="quantity" style="text-align: right;">${item.quantity.toFixed(2)}</td>
          <td style="text-align: right;">${EUR(item.rate_cents)}</td>
          <td style="text-align: right;"><strong>${EUR(item.amount_cents)}</strong></td>
        </tr>
      `).join('') || '<tr><td colspan="4" style="text-align: center; color: #999;">Geen regelitems</td></tr>'}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row subtotal">
      <span>Subtotaal</span>
      <span>${EUR(subtotal)}</span>
    </div>
    <div class="totals-row vat">
      <span>BTW (${invoice.vat_percent}%)</span>
      <span>${EUR(vat)}</span>
    </div>
    <div class="totals-row total">
      <span>Totaal</span>
      <span>${EUR(total)}</span>
    </div>
  </div>

  ${invoice.notes ? `
    <div class="notes">
      <h3>Notities</h3>
      <p>${invoice.notes}</p>
    </div>
  ` : ''}

  <div class="footer">
    <p>Bedankt voor uw opdracht!</p>
    <p>Bij vragen over deze factuur kunt u contact met ons opnemen.</p>
  </div>
</body>
</html>`;

    // Return HTML response that can be printed/saved as PDF
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="factuur-${invoice.invoice_number}.html"`,
      },
    });

  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
