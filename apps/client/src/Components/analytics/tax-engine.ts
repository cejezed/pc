// src/Components/analytics/tax-engine.ts
//
// Volledige NL-fiscale engine voor zzp/IB-ondernemer,
// geschikt voor jaarprojecties en kwartaalprognoses.
//
// Features:
// - Zelfstandigenaftrek
// - MKB-vrijstelling
// - Netto woning-effect (eigen woning forfait + hypotheekrenteaftrek)
// - Overige aftrekposten (lijfrente, giften, zorg, etc.)
// - Algemene heffingskorting
// - Arbeidskorting (benadering)
// - Zvw (met max-grondslag)
// - Persoonlijke per-jaar-profielen om te kalibreren op je echte IB-aangiftes.
//
// Doel: planning & coaching. Voor definitieve aangiftes altijd de Belastingdienst/boekhouder gebruiken.

export interface TaxBracket {
  /** Bovenkant van de schijf; null = onbeperkt (laatste schijf) */
  upto: number | null;
  /** Tarief voor deze schijf (bijv. 0.3697 = 36,97%) */
  rate: number;
}

/**
 * Extra persoonlijke parameters per jaar.
 * Hiermee kun je de engine kalibreren op basis van eerdere IB-aangiftes.
 */
export interface PersonalYearProfile {
  year: number;

  /** Netto woning-effect (EWF - hypotheekrente, Hillen etc.) */
  netHousingAdjustment?: number; // positief = extra belastbaar, negatief = aftrek

  /** Overige aftrekposten Box 1 (lijfrente, zorg, giften, etc.) */
  otherDeductions?: number;

  /** Overig box 1 inkomen naast winst uit onderneming (loon, resultaat, etc.) */
  otherBox1Income?: number;

  /**
   * Custom offset op heffingskortingen (bijv. partnerverdeling e.d.).
   * Positief = méér korting, negatief = minder.
   */
  creditsCorrection?: number;
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
  /** Jaar waarvoor we rekenen */
  year: number;
  /** Optioneel: dotatie oudedagsreserve (oude jaren) */
  forDotation?: number;
  /** Persoonlijk profiel voor dit jaar (woning, overige aftrek, etc.) */
  profile?: PersonalYearProfile | null;
}

export interface TaxComputationResult {
  year: number;

  // Basis
  businessProfit: number;
  otherBox1Income: number;
  totalBox1IncomeBeforeDeductions: number;

  // Ondernemersaftrek & MKB
  selfEmployedDeduction: number;
  forDotation: number;
  profitAfterEntrepreneurDeductions: number;
  mkbDeduction: number;
  profitAfterMkb: number;

  // Woning & overige aftrek
  netHousingAdjustment: number;
  otherDeductions: number;
  taxableIncomeBox1BeforeCredits: number;

  // Box 1 belasting bruto
  grossBox1Tax: number;

  // Heffingskortingen
  generalCredit: number;
  labourCredit: number;
  otherCredits: number; // eventueel aangevuld in profile
  totalCredits: number;

  // Inkomstenbelasting na kortingen
  incomeTax: number;

  // Zvw
  zvwContribution: number;

  // Totaal
  totalTax: number;
  effectiveTaxRate: number; // totale belasting / winst
}

/**
 * Default parameters per jaar.
 * Je kunt deze functie uitbreiden met exacte cijfers per jaar.
 */
function getTaxYearDefaults(year: number): TaxYearParams {
  // Voor nu: zelfde structuur voor recente jaren; later per jaar verfijnen.
  const base: TaxYearParams = {
    year,
    selfEmployedDeduction: 3750, // approx 2024-niveau
    mkbRate: 0.1331, // ~13,31%
    box1Brackets: [
      {
        upto: 73_031,
        rate: 0.3697, // schijf 1 (incl. premies)
      },
      {
        upto: null,
        rate: 0.495, // schijf 2
      },
    ],
    zvwRate: 0.0586,
    zvwMaxIncome: 71_000,
  };

  // Voorbeeld hoe je per jaar zou kunnen tweaken:
  // switch (year) {
  //   case 2020: return { ...base, selfEmployedDeduction: 7030, mkbRate: 0.14 };
  // }

  return base;
}

/**
 * Algemene heffingskorting (benadering, 2024-achtig).
 */
function calculateGeneralCredit(taxableIncomeBox1: number, year: number): number {
  if (taxableIncomeBox1 <= 0) return 0;

  // Zeer grove benadering:
  const maxCredit = 3362;
  const startPhaseOut = 25_000;
  const endPhaseOut = 75_000;

  if (taxableIncomeBox1 <= startPhaseOut) {
    return maxCredit;
  }
  if (taxableIncomeBox1 >= endPhaseOut) {
    return 0;
  }

  const ratio =
    1 - (taxableIncomeBox1 - startPhaseOut) / (endPhaseOut - startPhaseOut);

  return Math.max(0, maxCredit * ratio);
}

/**
 * Arbeidskorting (benadering, 2024-achtig).
 */
function calculateLabourCredit(workIncome: number, year: number): number {
  if (workIncome <= 0) return 0;

  // Piecewise lineaire benadering.
  if (workIncome <= 12_000) {
    return workIncome * 0.08; // 8% opbouw
  }
  if (workIncome <= 35_000) {
    return 960 + (workIncome - 12_000) * 0.27;
  }
  if (workIncome <= 77_000) {
    const maxCredit = 5000;
    const phaseOutStart = 35_000;
    const phaseOutEnd = 77_000;
    const ratio =
      1 - (workIncome - phaseOutStart) / (phaseOutEnd - phaseOutStart);
    return Math.max(0, maxCredit * ratio);
  }

  return 0;
}

/**
 * Toepassen van schijven voor Box 1.
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

    const span = remaining > bracket.upto ? bracket.upto : remaining;

    if (span > 0) {
      tax += span * bracket.rate;
      remaining -= span;
    }

    if (remaining <= 0) break;
  }

  return tax;
}

/**
 * Kernfunctie: bereken belasting voor een jaar op basis van winst en persoonlijk profiel.
 */
export function computeTaxForYear(
  input: TaxComputationInput,
  overrideParams?: TaxYearParams
): TaxComputationResult {
  const params = overrideParams ?? getTaxYearDefaults(input.year);
  const profile = input.profile || null;

  const profit = Math.max(0, input.businessProfit);
  const forDotation =
    input.forDotation && input.forDotation > 0 ? input.forDotation : 0;

  // Overig box 1 inkomen naast winst
  const otherBox1Income = profile?.otherBox1Income || 0;

  // 1. Totaal box 1 inkomen vóór aftrekposten
  const totalBox1IncomeBeforeDeductions = profit + otherBox1Income;

  // 2. Ondernemersaftrek + FOR
  const selfEmployedDeduction = Math.max(
    0,
    Math.min(params.selfEmployedDeduction, profit)
  );
  const profitAfterEntrepreneurDeductions = Math.max(
    0,
    profit - selfEmployedDeduction - forDotation
  );

  // 3. MKB-vrijstelling
  const mkbDeduction = profitAfterEntrepreneurDeductions * params.mkbRate;
  const profitAfterMkb = Math.max(
    0,
    profitAfterEntrepreneurDeductions - mkbDeduction
  );

  // 4. Netto woning-effect + overige aftrekposten
  const netHousingAdjustment = profile?.netHousingAdjustment || 0;
  const otherDeductions = profile?.otherDeductions || 0;

  // Netto Box 1 grondslag vóór credits:
  const taxableIncomeBox1BeforeCredits = Math.max(
    0,
    profitAfterMkb + otherBox1Income + netHousingAdjustment - otherDeductions
  );

  // 5. Bruto Box 1 belasting
  const grossBox1Tax = applyBox1Brackets(
    taxableIncomeBox1BeforeCredits,
    params.box1Brackets
  );

  // 6. Heffingskortingen (algemeen + arbeid)
  const generalCredit = calculateGeneralCredit(
    taxableIncomeBox1BeforeCredits,
    params.year
  );
  const labourCredit = calculateLabourCredit(
    totalBox1IncomeBeforeDeductions,
    params.year
  );
  const otherCredits = profile?.creditsCorrection || 0;

  const totalCredits = generalCredit + labourCredit + otherCredits;

  const incomeTax = Math.max(0, grossBox1Tax - totalCredits);

  // 7. Zvw over winst (t/m max)
  const zvwBase = params.zvwMaxIncome
    ? Math.min(profit, params.zvwMaxIncome)
    : profit;
  const zvwContribution = zvwBase * params.zvwRate;

  // 8. Totaal en effectieve druk
  const totalTax = incomeTax + zvwContribution;
  const effectiveTaxRate = profit > 0 ? totalTax / profit : 0;

  return {
    year: params.year,
    businessProfit: profit,
    otherBox1Income,
    totalBox1IncomeBeforeDeductions,
    selfEmployedDeduction,
    forDotation,
    profitAfterEntrepreneurDeductions,
    mkbDeduction,
    profitAfterMkb,
    netHousingAdjustment,
    otherDeductions,
    taxableIncomeBox1BeforeCredits,
    grossBox1Tax,
    generalCredit,
    labourCredit,
    otherCredits,
    totalCredits,
    incomeTax,
    zvwContribution,
    totalTax,
    effectiveTaxRate,
  };
}

/**
 * Input voor kwartaalprojectie.
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
  /** Optioneel: persoonlijk profiel voor dit jaar */
  profile?: PersonalYearProfile | null;
}

export interface QuarterProjectionResult extends TaxComputationResult {
  currentQuarter: number;
  /** Winst t/m huidig kwartaal */
  yearToDateProfit: number;
  /** Geprojecteerde jaarwinst (op basis van huidige tempo) */
  projectedYearProfit: number;
}

/**
 * Jaarprojectie op basis van ingevulde kwartalen.
 * Q1 → factor 4; Q2 → factor 2; Q3 → factor 4/3; Q4 → factor 1.
 */
export function projectTaxFromQuarters(
  input: QuarterProjectionInput,
  overrideParams?: TaxYearParams
): QuarterProjectionResult {
  const qCount = Math.max(1, Math.min(4, input.currentQuarter || 1));

  let ytdProfit = 0;
  for (let i = 0; i < qCount; i++) {
    const q = input.quarters[i] || { income: 0, expenses: 0 };
    const profitQ = (q.income || 0) - (q.expenses || 0);
    ytdProfit += profitQ;
  }

  const factor = qCount === 4 ? 1 : 4 / qCount;
  const projectedProfit = ytdProfit * factor;

  const tax = computeTaxForYear(
    {
      year: input.year,
      businessProfit: projectedProfit,
      profile: input.profile || null,
    },
    overrideParams
  );

  return {
    ...tax,
    currentQuarter: qCount,
    yearToDateProfit: ytdProfit,
    projectedYearProfit: projectedProfit,
  };
}

/**
 * Public helper om de default jaarparameters op te vragen.
 */
export function getDefaultTaxYearParams(year: number): TaxYearParams {
  return getTaxYearDefaults(year);
}
