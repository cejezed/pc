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
  const [purchasedLocation, setPurchasedLocation] = React.useState("");

  React.useEffect(() => {
    if (item?.estimated_cost_cents) {
      setActualCostEuros((item.estimated_cost_cents / 100).toString());
    } else {
      setActualCostEuros("");
    }
    setPurchasedLocation(item?.store || "");
  }, [item]);

  const handleConfirm = () => {
    if (!actualCostEuros) return;

    const data: PurchaseData = {
      actual_cost_cents: Math.round(parseFloat(actualCostEuros) * 100),
      purchased_at: new Date().toISOString(),
      purchased_location: purchasedLocation.trim() || undefined,
    };

    onConfirm(data);
  };

  if (!isOpen || !item) return null;

  const difference =
    item.estimated_cost_cents && actualCostEuros
      ? Math.round(parseFloat(actualCostEuros) * 100) - item.estimated_cost_cents
      : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="zeus-card w-full max-w-md">
        <div className="flex justify-between items-center mb-4 p-6 border-b border-[var(--zeus-border)]">
          <h3 className="text-lg font-semibold text-[var(--zeus-text)]">Item gekocht</h3>
          <button
            onClick={onClose}
            className="text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="mb-4">
            <p className="text-[var(--zeus-text-secondary)] mb-2">Je hebt gekocht:</p>
            <p className="text-lg font-semibold text-[var(--zeus-text)]">{item.name}</p>
          </div>

          {item.estimated_cost_cents && (
            <div className="bg-[var(--zeus-bg-secondary)] p-3 rounded-lg border border-[var(--zeus-border)]">
              <p className="text-sm text-[var(--zeus-text-secondary)]">Geschatte prijs:</p>
              <p className="text-lg font-medium text-[var(--zeus-text)]">
                {EUR(item.estimated_cost_cents)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
              Werkelijke prijs (€) *
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={actualCostEuros}
              onChange={(e) => setActualCostEuros(e.target.value)}
              className="input-zeus"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
              Waar gekocht? (optioneel)
            </label>
            <input
              type="text"
              placeholder="Bijv. Bol.com, IKEA, Albert Heijn..."
              value={purchasedLocation}
              onChange={(e) => setPurchasedLocation(e.target.value)}
              className="input-zeus"
            />
          </div>

          {difference !== null && (
            <div
              className={`p-3 rounded-lg border ${difference > 0
                  ? "bg-red-900/20 border-red-800/50 text-red-400"
                  : difference < 0
                    ? "bg-green-900/20 border-green-800/50 text-green-400"
                    : "bg-blue-900/20 border-blue-800/50 text-blue-400"
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

        <div className="flex gap-2 p-6 border-t border-[var(--zeus-border)] bg-[var(--zeus-bg-secondary)]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[var(--zeus-border)] text-[var(--zeus-text-secondary)] rounded-lg hover:bg-[var(--zeus-card-hover)] hover:text-[var(--zeus-text)]"
          >
            Annuleren
          </button>
          <button
            onClick={handleConfirm}
            disabled={!actualCostEuros || isPending}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20"
          >
            <Check className="w-4 h-4" />
            {isPending ? "Opslaan..." : "Bevestigen"}
          </button>
        </div>
      </div>
    </div>
  );
}