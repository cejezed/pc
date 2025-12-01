// src/Components/analytics/finance-alerts.ts
//
// Kleine "coach/alert" laag bovenop de tax-engine.
// Detecteert o.a. wanneer je richting ~50% belastingdruk gaat.

import {
  QuarterProjectionResult,
  TaxYearParams,
} from "./tax-engine";

export type AlertLevel = "info" | "warning" | "critical";

export interface TaxAlert {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
}

/**
 * Bouwt een set alerts op basis van een kwartaalprojectie.
 * Heuristieken zijn bewust simpel & uitlegbaar.
 */
export function buildTaxAlertsFromProjection(
  proj: QuarterProjectionResult | null,
  params: TaxYearParams
): TaxAlert[] {
  if (!proj || proj.businessProfit <= 0) return [];

  const alerts: TaxAlert[] = [];

  const taxRate = proj.effectiveTaxRate; // 0–1
  const taxable = proj.taxableIncomeBox1;
  const profit = proj.projectedYearProfit;
  const freeAfterTax = profit - proj.totalTax;

  // 1. Drempel richting 50% belastingdruk
  if (taxRate >= 0.5) {
    alerts.push({
      id: "near-50-critical",
      level: "critical",
      title: "Je effectieve belastingdruk ligt rond of boven 50%",
      description:
        "Op basis van je huidige tempo kom je uit op een totale belastingdruk (IB + Zvw) van ongeveer " +
        Math.round(taxRate * 100) +
        "%. Dit is erg hoog; het is zinvol om te kijken naar spreiding, investeringen of timing van inkomsten en kosten.",
    });
  } else if (taxRate >= 0.45) {
    alerts.push({
      id: "near-50-warning",
      level: "warning",
      title: "Je belastingdruk komt in de buurt van 50%",
      description:
        "De geprojecteerde belastingdruk is ongeveer " +
        Math.round(taxRate * 100) +
        "%. Je zit in de zone waar afbouw van kortingen en hogere tarieven samen optellen. Extra winst wordt relatief zwaar belast.",
    });
  }

  // 2. Hoog inkomen → afbouw-zone heffingskortingen (globale drempel)
  if (taxable >= 80000 && taxable < 110000) {
    alerts.push({
      id: "kortingen-phaseout",
      level: "info",
      title: "Je zit in de afbouw-zone van kortingen",
      description:
        "Je belastbare inkomen Box 1 ligt rond " +
        formatEUR(taxable) +
        ". In deze regionen worden arbeids- en algemene heffingskortingen flink afgebouwd, waardoor extra inkomen relatief zwaar wordt belast.",
    });
  } else if (taxable >= 110000) {
    alerts.push({
      id: "high-income",
      level: "warning",
      title: "Zeer hoog belastbaar inkomen",
      description:
        "Je belastbare inkomen Box 1 ligt boven ongeveer € 110.000. Vrijwel alle kortingen zijn dan afgebouwd en je extra inkomen wordt bijna volledig tegen toptarief belast.",
    });
  }

  // 3. Vrije cash na belasting relatief laag t.o.v. winst
  if (profit > 0) {
    const freeRatio = freeAfterTax / profit;
    if (freeRatio < 0.4) {
      alerts.push({
        id: "low-free-cash",
        level: "warning",
        title: "Relatief weinig vrije cash na belasting",
        description:
          "Van je geprojecteerde winst blijft na IB en Zvw minder dan 40% over als vrije cash. Overweeg of je buffer, investeringen en privé-uitgaven hiermee in balans zijn.",
      });
    }
  }

  // 4. Heel forse winst → algemene reflectie
  if (profit >= 150000) {
    alerts.push({
      id: "very-high-profit",
      level: "info",
      title: "Zeer hoge geprojecteerde jaarwinst",
      description:
        "Je huidige tempo wijst op een jaarwinst van ongeveer " +
        formatEUR(profit) +
        ". Dit is een goed moment om expliciet na te denken over pensioen, reserves, investeringen en risicospreiding.",
    });
  }

  return alerts;
}

function formatEUR(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
