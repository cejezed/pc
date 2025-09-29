import React from "react";
import type { ShoppingItem } from "./hooks";
import { EUR } from "./basis-componenten";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

type BudgetOverzichtProps = {
  items: ShoppingItem[];
};

export function BudgetOverzicht({ items }: BudgetOverzichtProps) {
  const stats = React.useMemo(() => {
    const active = items.filter((item) => !item.purchased_at);
    const purchased = items.filter((item) => item.purchased_at);

    const totalEstimated = active.reduce(
      (sum, item) => sum + (item.estimated_cost_cents || 0),
      0
    );

    const totalPurchased = purchased.reduce(
      (sum, item) => sum + (item.actual_cost_cents || 0),
      0
    );

    const totalPurchasedEstimated = purchased.reduce(
      (sum, item) => sum + (item.estimated_cost_cents || 0),
      0
    );

    const savings = totalPurchasedEstimated - totalPurchased;

    return {
      totalEstimated,
      totalPurchased,
      savings,
      activeCount: active.length,
      purchasedCount: purchased.length,
    };
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Te besteden</h3>
        </div>
        <p className="text-2xl font-bold text-blue-600">
          {EUR(stats.totalEstimated)}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {stats.activeCount} {stats.activeCount === 1 ? "item" : "items"} op
          lijst
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Uitgegeven</h3>
        </div>
        <p className="text-2xl font-bold text-green-600">
          {EUR(stats.totalPurchased)}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {stats.purchasedCount}{" "}
          {stats.purchasedCount === 1 ? "item" : "items"} gekocht
        </p>
      </div>

      <div
        className={`border rounded-lg p-4 ${
          stats.savings > 0
            ? "bg-green-50 border-green-200"
            : stats.savings < 0
            ? "bg-red-50 border-red-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {stats.savings >= 0 ? (
            <TrendingDown className="w-5 h-5 text-green-600" />
          ) : (
            <TrendingUp className="w-5 h-5 text-red-600" />
          )}
          <h3 className="font-semibold text-gray-900">
            {stats.savings >= 0 ? "Bespaard" : "Extra uitgegeven"}
          </h3>
        </div>
        <p
          className={`text-2xl font-bold ${
            stats.savings > 0
              ? "text-green-600"
              : stats.savings < 0
              ? "text-red-600"
              : "text-gray-600"
          }`}
        >
          {EUR(Math.abs(stats.savings))}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          vs. geschatte prijzen
        </p>
      </div>
    </div>
  );
}