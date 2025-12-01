// src/Components/analytics/tax-profiles.ts
//
// Persoonlijke fiscale profielen per jaar.
// Doel: de tax-engine afstemmen op je echte IB-aangiftes.
//
// Werkwijze:
// - Per jaar (2016–2024) vul je hier de woning-/aftrek-/correctiewaarden in
//   op basis van de IB-pdf.
// - De tax-engine gebruikt deze profielen in computeTaxForYear / projectTaxFromQuarters,
//   zodat de uitkomst in de buurt komt van je echte aanslagen.

import type { PersonalYearProfile } from "./tax-engine";

export const PERSONAL_TAX_PROFILES: PersonalYearProfile[] = [
  // 🔽 VOORBEELD 2024 – waardes hier zijn placeholders.
  // Vul ze in op basis van je IB-aangifte 2024, zodat de
  // uitkomst rond ~€21.000 belasting bij €79.000 winst komt.
  {
    year: 2024,
    netHousingAdjustment: 0,
    otherDeductions: 0,
    otherBox1Income: 0,
    creditsCorrection: 0,
  },

  {
    year: 2023,
    netHousingAdjustment: 0,
    otherDeductions: 0,
    otherBox1Income: 0,
    creditsCorrection: 0,
  },
  {
    year: 2022,
    netHousingAdjustment: 0,
    otherDeductions: 0,
    otherBox1Income: 0,
    creditsCorrection: 0,
  },
  {
    year: 2021,
    netHousingAdjustment: 0,
    otherDeductions: 0,
    otherBox1Income: 0,
    creditsCorrection: 0,
  },
  {
    year: 2020,
    netHousingAdjustment: 0,
    otherDeductions: 0,
    otherBox1Income: 0,
    creditsCorrection: 0,
  },
  {
    year: 2019,
    netHousingAdjustment: 0,
    otherDeductions: 0,
    otherBox1Income: 0,
    creditsCorrection: 0,
  },
  {
    year: 2018,
    netHousingAdjustment: 0,
    otherDeductions: 0,
    otherBox1Income: 0,
    creditsCorrection: 0,
  },
  {
    year: 2017,
    netHousingAdjustment: 0,
    otherDeductions: 0,
    otherBox1Income: 0,
    creditsCorrection: 0,
  },
  {
    year: 2016,
    netHousingAdjustment: 0,
    otherDeductions: 0,
    otherBox1Income: 0,
    creditsCorrection: 0,
  },
];

export function getProfileForYear(year: number): PersonalYearProfile | null {
  return PERSONAL_TAX_PROFILES.find((p) => p.year === year) ?? null;
}
