import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // TODO: Implementeer PDF generatie
  // Gebruik bijv. @react-pdf/renderer of Puppeteer
  
  return NextResponse.json({ 
    message: 'PDF generation not yet implemented',
    invoice_id: params.id 
  });
}