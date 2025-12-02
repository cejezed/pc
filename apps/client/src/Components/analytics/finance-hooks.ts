// src/Components/analytics/finance-hooks.ts

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import type { FinancialYearReportRow } from "./finance-types";
import {
  buildRevenueSeries,
  buildCostSeries,
  buildPrivateSeries,
  buildVatSeries,
} from "./finance-utils";

export function useFinanceAnalytics(userId: string | null) {
  const query = useQuery({
    queryKey: ["finance-year-reports", userId],
    enabled: !!userId,
    queryFn: async (): Promise<FinancialYearReportRow[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("financial_year_reports")
        .select("*")
        .eq("user_id", userId)
        .order("year", { ascending: true });

      if (error) throw error;
      return (data || []) as FinancialYearReportRow[];
    },
  });

  const reports = query.data ?? [];

  const revenueSeries = buildRevenueSeries(reports);
  const costSeries = buildCostSeries(reports);
  const privateSeries = buildPrivateSeries(reports);
  const vatSeries = buildVatSeries(reports);

  return {
    reports,
    revenueSeries,
    costSeries,
    privateSeries,
    vatSeries,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Alias voor FinanceTaxCockpit component
export function useFinancialReports(userId?: string) {
  return useFinanceAnalytics(userId ?? null);
}
