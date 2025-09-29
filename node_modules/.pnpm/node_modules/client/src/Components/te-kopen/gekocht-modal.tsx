import React from "react";
import { X, Check } from "lucide-react";
import type { ShoppingItem, PurchaseData } from "./hooks";
import { EUR } from "./basis-componenten";

type PurchaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: PurchaseData) => void;
  item: ShoppingItem | null;
  isPending?: boolean;
};

export function PurchaseModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  isPending,
}: PurchaseModalProps) {
  const [actualCostEuros, setActualCostEuros] = React.useState("");

  React.useEffect(() => {
    if (item?.estimated_cost_cents) {
      setActualCostEuros((item.estimated_cost_cents / 100).toString());
    } else {
      setActualCostEuros("");
    }
  }, [item]);

  const handleConfirm = () => {
    if (!actualCostEuros) return;

    const data: PurchaseData = {
      actual_cost_cents: Math.round(parseFloat(actualCostEuros) * 100),
      purchased_at: new Date().toISOString(),
    };

    onConfirm(data);
  };

  if (!isOpen || !item) return null;

  const difference =
    item.estimated_cost_cents && actualCostEuros
      ? Math.round(parseFloat(actualCostEuros) * 100) - item.estimated_cost_cents
      : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Item gekocht</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 mb-2">Je hebt gekocht:</p>
          <p className="text-lg font-semibold text-gray-900">{item.name}</p>
        </div>

        <div className="space-y-4">
          {item.estimated_cost_cents && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Geschatte prijs:</p>
              <p className="text-lg font-medium text-gray-900">
                {EUR(item.estimated_cost_cents)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Werkelijke prijs (€) *
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={actualCostEuros}
              onChange={(e) => setActualCostEuros(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              autoFocus
            />
          </div>

          {difference !== null && (
            <div
              className={`p-3 rounded-lg ${
                difference > 0
                  ? "bg-red-50 text-red-800"
                  : difference < 0
                  ? "bg-green-50 text-green-800"
                  : "bg-blue-50 text-blue-800"
              }`}
            >
              <p className="text-sm font-medium">
                {difference > 0
                  ? `${EUR(Math.abs(difference))} duurder dan verwacht`
                  : difference < 0
                  ? `${EUR(Math.abs(difference))} goedkoper dan verwacht`
                  : "Exact zoals verwacht"}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Annuleren
          </button>
          <button
            onClick={handleConfirm}
            disabled={!actualCostEuros || isPending}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {isPending ? "Opslaan..." : "Bevestigen"}
          </button>
        </div>
      </div>
    </div>
  );
}