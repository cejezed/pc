// src/components/abonnementen/basis-componenten.tsx
import React from "react";
import { AlertCircle, Calendar, Euro, Bell } from "lucide-react";
import type { Subscription } from "./types";
import { formatCurrency } from "./helpers";

export function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && <div className="text-xs text-gray-500 mt-1">{trend}</div>}
    </div>
  );
}

export function CategoryBadge({ category }: { category?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(category)}`}
    >
      <span>{getCategoryIcon(category)}</span>
      <span className="capitalize">{category || "other"}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    expired: "bg-gray-100 text-gray-700 border-gray-200",
    paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${colors[status] || colors.active}`}
    >
      {status === "active" ? "Actief" : status === "cancelled" ? "Opgezegd" : status === "paused" ? "Gepauzeerd" : "Verlopen"}
    </span>
  );
}

export function DeadlineWarning({ daysUntil }: { daysUntil: number }) {
  if (daysUntil > 7) return null;

  const urgent = daysUntil <= 3;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        urgent
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-yellow-50 text-yellow-700 border border-yellow-200"
      }`}
    >
      <AlertCircle className="w-4 h-4" />
      <span>
        {urgent ? "Urgente" : "Binnenkort"} opzegtermijn: nog {daysUntil} dag
        {daysUntil !== 1 ? "en" : ""}
      </span>
    </div>
  );
}

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
}: {
  subscription: Subscription;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const daysUntilDeadline = subscription.cancellation_deadline
    ? Math.ceil(
        (new Date(subscription.cancellation_deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="rounded-xl border bg-white p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{subscription.name}</h3>
          {subscription.description && (
            <p className="text-sm text-gray-600 mt-1">
              {subscription.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <CategoryBadge category={subscription.category} />
        <StatusBadge status={subscription.status} />
      </div>

      {daysUntilDeadline !== null && daysUntilDeadline >= 0 && (
        <DeadlineWarning daysUntil={daysUntilDeadline} />
      )}

      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600 mb-1">💰 Kosten</div>
          <div className="font-semibold">
            {EUR(subscription.cost_cents)}{" "}
            <span className="text-gray-500 font-normal">
              {formatBillingCycle(subscription.billing_cycle)}
            </span>
          </div>
        </div>
        <div>
          <div className="text-gray-600 mb-1">📅 Volgende betaling</div>
          <div className="font-semibold">
            {subscription.next_billing_date
              ? new Date(subscription.next_billing_date).toLocaleDateString(
                  "nl-NL"
                )
              : "-"}
          </div>
        </div>
      </div>

      {subscription.cancellation_period_days && (
        <div className="mt-3 pt-3 border-t text-xs text-gray-600">
          ⏰ Opzegtermijn: {subscription.cancellation_period_days} dagen voor
          verlengdatum
        </div>
      )}

      {subscription.notes && (
        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
          📝 {subscription.notes}
        </div>
      )}
    </div>
  );
}

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📋</div>
      <h3 className="text-lg font-semibold mb-2">Geen abonnementen</h3>
      <p className="text-gray-600 mb-4">
        Voeg je eerste abonnement toe om kosten en opzegtermijnen bij te houden
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
      >
        <span>➕</span>
        Abonnement toevoegen
      </button>
    </div>
  );
}