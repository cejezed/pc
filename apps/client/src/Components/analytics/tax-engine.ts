// src/Components/analytics/tax-engine.ts
//
// Eenvoudige Nederlandse ondernemers-belastingengine (benadering).
// Doel: inzicht & planning, niet 100% fiscale nauwkeurigheid.
//
// Berekeningen:
// - winst → zelfstandigenaftrek → MKB-vrijstelling → belastbaar inkomen Box 1
// - box 1 schijven → inkomstenbelasting (zonder detailkortingen)
// - Zvw over winst (t/m een max)
// - totale belasting + effectieve druk

export interface TaxBracket {
  /** Bovenkant van de schijf; null = onbeperkt (laatste schijf) */
  upto: number | null;
  /** Tarief voor deze schijf (bijv. 0.3697 = 36,97%) */
  rate: number;
}

export interface TaxYearParams {
  year: number;
  /** Zelfstandigenaftrek in euro's (vast bedrag) */
  selfEmployedDeduction: number;
  /** MKB-vrijstelling als fractie (bijv. 0.1331 = 13,31%) */
  mkbRate: number;
  /** Tarieven Box 1 */
  box1Brackets: TaxBracket[];
  /** Zvw-percentage over winst */
  zvwRate: number;
  /** Maximaal inkomen waarover Zvw wordt geheven (mag null zijn voor "geen max") */
  zvwMaxIncome: number | null;
}

export interface TaxComputationInput {
  /** Jaarwinst vóór belasting (winst uit onderneming) */
  businessProfit: number;
  /** Jaar waar de parameters voor gelden */
  year: number;
  /** Optioneel: FOR-dotatie (wordt hier niet automatisch berekend) */
  forDotation?: number;
}

export interface TaxComputationResult {
  year: number;
  businessProfit: number;

  // Aftrek & grondslag
  selfEmployedDeduction: number;
  profitAfterSelfEmployed: number;
  mkbDeduction: number;
  taxableIncomeBox1: number;

  // Belastingen
  incomeTax: number;
  zvwContribution: number;
  totalTax: number;

  // Kengetallen
  effectiveTaxRate: number; // totale belasting / winst
}

/**
 * Simpele default parameters voor NL zzp / IB-ondernemer (globale benadering).
 * Pas hier de cijfers aan als de wetgeving wijzigt.
 */
export function getDefaultTaxYearParams(year: number): TaxYearParams {
  // Voor nu gebruiken we één set voor recente jaren (2022+).
  // Je kunt dit later differentiëren per jaar.
  const brackets: TaxBracket[] = [
    {
      // Schijf 1: tot ~73k, tarief (IB + volksverzekeringen) samengenomen.
      upto: 73031,
      rate: 0.3697,
    },
    {
      // Schijf 2: boven deze grens
      upto: null,
      rate: 0.495,
    },
  ];

  return {
    year,
    selfEmployedDeduction: 3750, // kan per jaar aangepast worden
    mkbRate: 0.1331,
    box1Brackets: brackets,
    zvwRate: 0.0586,
    zvwMaxIncome: 71000,
  };
}

/**
 * Past box 1-tarieven toe op de belastbare grondslag.
 */
export function applyBox1Brackets(
  taxableIncome: number,
  brackets: TaxBracket[]
): number {
  if (taxableIncome <= 0) return 0;

  let remaining = taxableIncome;
  let tax = 0;

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    if (bracket.upto == null) {
      tax += remaining * bracket.rate;
      break;
    }

    const span =
      remaining > bracket.upto ? bracket.upto : remaining;

    if (span > 0) {
      tax += span * bracket.rate;
      remaining -= span;
    }

    if (remaining <= 0) break;
  }

  return tax;
}

/**
 * Kernfunctie: van jaarwinst → belastingdruk (IB + Zvw).
 *
 * Let op: dit is een benadering – heffingskortingen en andere
 * details worden hier niet expliciet meegenomen. Doel = planning.
 */
export function computeTaxForYear(
  input: TaxComputationInput,
  params?: TaxYearParams
): TaxComputationResult {
  const effectiveParams = params ?? getDefaultTaxYearParams(input.year);
  const profit = Math.max(0, input.businessProfit);

  // 1. Zelfstandigenaftrek toepassen
  const selfEmployedDeduction = Math.max(
    0,
    Math.min(effectiveParams.selfEmployedDeduction, profit)
  );
  const profitAfterSelfEmployed = Math.max(
    0,
    profit - selfEmployedDeduction
  );

  // 2. MKB-vrijstelling
  const mkbDeduction =
    profitAfterSelfEmployed * effectiveParams.mkbRate;
  const taxableIncomeBox1 = Math.max(
    0,
    profitAfterSelfEmployed - mkbDeduction
  );

  // 3. Box 1 belasting
  const incomeTax = applyBox1Brackets(
    taxableIncomeBox1,
    effectiveParams.box1Brackets
  );

  // 4. Zvw over winst (t/m max)
  const zvwBase = effectiveParams.zvwMaxIncome
    ? Math.min(profit, effectiveParams.zvwMaxIncome)
    : profit;
  const zvwContribution = zvwBase * effectiveParams.zvwRate;

  const totalTax = incomeTax + zvwContribution;
  const effectiveTaxRate =
    profit > 0 ? totalTax / profit : 0;

  return {
    year: effectiveParams.year,
    businessProfit: profit,
    selfEmployedDeduction,
    profitAfterSelfEmployed,
    mkbDeduction,
    taxableIncomeBox1,
    incomeTax,
    zvwContribution,
    totalTax,
    effectiveTaxRate,
  };
}

/**
 * Input voor kwartaalprojectie: je vult t/m een bepaalde kwartaal
 * de inkomens & uitgaven in, en de engine projecteert het jaar.
 */
export interface QuarterProjectionInput {
  year: number;
  /** 1 = Q1, 2 = Q2, etc. */
  currentQuarter: number;
  /** Per kwartaal: omzet / kosten */
  quarters: {
    income: number;
    expenses: number;
  }[];
}

export interface QuarterProjectionResult
  extends TaxComputationResult {
  currentQuarter: number;
  /** Winst t/m huidig kwartaal */
  yearToDateProfit: number;
  /** Projectie van de jaarwinst (op basis van huidige tempo) */
  projectedYearProfit: number;
}

/**
 * Maakt een jaarprojectie op basis van de ingevulde kwartalen.
 * Voorbeeld:
 * - Na Q1 → winst * 4
 * - Na Q2 → winst * 2
 * - Na Q3 → winst * (4 / 3)
 * - Na Q4 → winst * 1 (feitelijk jaarresultaat)
 */
export function projectTaxFromQuarters(
  input: QuarterProjectionInput,
  params?: TaxYearParams
): QuarterProjectionResult {
  const qCount = Math.max(
    1,
    Math.min(4, input.currentQuarter || 1)
  );

  let ytdProfit = 0;
  for (let i = 0; i < qCount; i++) {
    const q = input.quarters[i] || { income: 0, expenses: 0 };
    const profitQ = (q.income || 0) - (q.expenses || 0);
    ytdProfit += profitQ;
  }

  const factor =
    qCount === 4 ? 1 : 4 / qCount;
  const projectedProfit = ytdProfit * factor;

  const tax = computeTaxForYear(
    {
      year: input.year,
      businessProfit: projectedProfit,
    },
    params
  );

  return {
    ...tax,
    currentQuarter: qCount,
    yearToDateProfit: ytdProfit,
    projectedYearProfit: projectedProfit,
  };
}
