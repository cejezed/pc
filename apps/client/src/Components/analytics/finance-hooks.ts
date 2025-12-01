// components/analytics/finance-hooks.ts

import { useFinancialReports } from "./hooks";
import { 
  buildRevenueSeries,
  buildCostSeries,
  buildVatSeries,
  buildPrivateSeries,
} from "./finance-utils";

export function useFinanceAnalytics(userId?: string) {
  const state = useFinancialReports(userId);

  return {
    ...state,
    revenueSeries: buildRevenueSeries(state.reports),
    costSeries: buildCostSeries(state.reports),
    vatSeries: buildVatSeries(state.reports),
    privateSeries: buildPrivateSeries(state.reports),
  };
}
