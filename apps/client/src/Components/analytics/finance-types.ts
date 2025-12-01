// src/Components/analytics/finance-types.ts

export interface VatInfo {
  vat_payable?: number | null;
  q1?: number | null;
  q2?: number | null;
  q3?: number | null;
  q4?: number | null;
}

export interface SalesCostItem {
  label: string;
  amount: number;
}

export interface CostDetails {
  sales_costs?: SalesCostItem[];
  office_costs?: SalesCostItem[];
  vehicle_costs?: SalesCostItem[];
  general_expenses?: SalesCostItem[];
}

export interface FinancialYearRawJson {
  year: number;
  vat?: VatInfo;
  cost_details?: CostDetails;
  // overige velden laten we flexibel
  [key: string]: unknown;
}

export interface FinancialYearReportRow {
  id: string;
  user_id: string;
  year: number;

  revenue: number | string | null;
  net_profit: number | string | null;

  office_costs: number | string | null;
  vehicle_costs: number | string | null;
  general_expenses: number | string | null;

  private_withdrawals: number | string | null;

  raw_json: FinancialYearRawJson | null;
}

export interface RevenueProfitPoint {
  year: number;
  revenue: number;
  net_profit: number;
}

export interface CostStructurePoint {
  year: number;
  office: number;
  vehicle: number;
  sales: number;
  general: number;
}

export interface PrivateWithdrawalsPoint {
  year: number;
  withdrawals: number;
}

export interface VatQuarterPoint {
  year: number;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  amount: number;
}
