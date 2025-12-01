// src/Components/analytics/finance-alerts.ts
//
// Bouwt waarschuwingen ("alerts") op basis van de
// kwartaalprojectie + belastingberekening.
//
// Doel: geen exacte fiscale diagnose, maar:
// - signaleren wanneer je belastingdruk hard oploopt
// - aangeven wanneer je in de hoge schijf zit
// - je bewust maken van "extra euro = dure euro"-zones.

import type {
  QuarterProjectionResult,
  TaxYearParams,
} from "./tax-engine";

export type TaxAlertLevel = "info" | "warning" | "critical";

export interface TaxAlert {
  id: string;
  level: TaxAlertLevel;
  title: string;
  description: string;
}

/**
 * Bouw een set alerts op basis van de huidige projectie.
 * Dit is expliciet heuristisch: bedoeld als coaching, niet als formeel advies.
 */
export function buildTaxAlertsFromProjection(
  proj: QuarterProjectionResult | null,
  params: TaxYearParams
): TaxAlert[] {
  const alerts: TaxAlert[] = [];

  if (!proj || proj.projectedYearProfit <= 0) {
    return alerts;
  }

  const profit = proj.projectedYearProfit;
  const effectiveRate = proj.effectiveTaxRate;
  const incomeTax = proj.incomeTax;
  const zvw = proj.zvwContribution;
  const totalTax = proj.totalTax;

  // Let op: nieuwe tax-engine gebruikt taxableIncomeBox1BeforeCredits.
  const taxable =
    proj.taxableIncomeBox1BeforeCredits ?? proj.businessProfit;

  // 1️⃣ Alert: hoge effectieve belastingdruk
  if (effectiveRate >= 0.5) {
    alerts.push({
      id: "high-effective-rate-critical",
      level: "critical",
      title: "Je totale belastingdruk nadert 50%",
      description:
        `Op basis van de huidige prognose betaal je ongeveer ` +
        `${Math.round(effectiveRate * 100)}% belasting over je winst (IB + Zvw). ` +
        `Dit is het niveau waarop elke extra euro winst relatief duur wordt. ` +
        `Overweeg om bewust investeringen, reserveringen of privé-opnames te plannen.`,
    });
  } else if (effectiveRate >= 0.4) {
    alerts.push({
      id: "high-effective-rate-warning",
      level: "warning",
      title: "Je belastingdruk loopt stevig op",
      description:
        `Je effectieve belastingdruk ligt rond de ` +
        `${Math.round(effectiveRate * 100)}%. ` +
        `Een groot deel van extra winst valt hiermee in een relatief hoge schijf. ` +
        `Het kan zinvol zijn om vooruit te plannen: investeringen, pensioeninleg ` +
        `of schuiven met uitgaven over jaren heen.`,
    });
  }

  // 2️⃣ Alert: je zit (grotendeels) in de hoge schijf
  const firstBracket = params.box1Brackets[0];
  const highBracketThreshold =
    typeof firstBracket.upto === "number" ? firstBracket.upto : 73_031;

  if (taxable > highBracketThreshold) {
    alerts.push({
      id: "high-bracket-warning",
      level: "warning",
      title: "Je valt (deels) in de hoogste inkomstenbelastingschijf",
      description:
        `Je belastbaar inkomen in box 1 wordt geschat op ongeveer ` +
        `€${formatNumber(taxable)}. Daarmee kom je (deels) in de hoogste ` +
        `inkomstenbelastingschijf terecht. Dat betekent dat een deel van je ` +
        `extra winst belast wordt tegen circa 49,5%.`,
    });
  }

  // 3️⃣ Alert: totale belasting in euro's is substantieel
  if (totalTax > 0) {
    alerts.push({
      id: "total-tax-info",
      level: "info",
      title: "Indicatie totale belasting dit jaar",
      description:
        `Op basis van je huidige invoer komt de totale belasting (IB + Zvw) uit op ` +
        `ongeveer €${formatNumber(totalTax)} bij een geprojecteerde winst van ` +
        `circa €${formatNumber(profit)}. Dit is een indicatie om tijdig te ` +
        `reserveren, geen definitieve aanslag.`,
    });
  }

  // 4️⃣ Alert: relatief lage winst
  if (profit > 0 && profit < 40_000) {
    alerts.push({
      id: "low-profit-info",
      level: "info",
      title: "Relatief bescheiden winst",
      description:
        `Je geprojecteerde jaarwinst ligt rond de €${formatNumber(profit)}. ` +
        `Controleer of dit past bij je gewenste privé-uitgaven en reserveringen ` +
        `voor belasting, vakanties en buffer. Dit is geen waardeoordeel, maar een ` +
        `check of je cijfers overeenkomen met je plannen.`,
    });
  }

  // 5️⃣ Alert: verhouding IB vs. Zvw
  if (zvw > 0 && incomeTax > 0) {
    const zvwShare = zvw / totalTax;
    if (zvwShare > 0.2) {
      alerts.push({
        id: "zvw-share-info",
        level: "info",
        title: "Zvw-bijdrage is een zichtbaar deel van je belasting",
        description:
          `Van je totale belasting van ongeveer €${formatNumber(
            totalTax
          )} bestaat circa ` +
          `${Math.round(zvwShare * 100)}% uit Zvw-bijdrage. Dit wordt vaak vergeten ` +
          `in reserveringen, maar is wel een echte cash-out. Neem dit mee in je ` +
          `bufferplanning.`,
      });
    }
  }

  return alerts;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    maximumFractionDigits: 0,
  }).format(value);
}
