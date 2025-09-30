// src/Components/abonnementen/abonnement-card.tsx
import { Edit2, Trash2, AlertCircle, Clock, Euro, Calendar } from "lucide-react";
import type { Subscription } from "./types";
import { EUR, formatBillingCycle, getCategoryColor, getCategoryIcon, daysUntil } from "./helpers";

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
}: {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
}) {
  const daysUntilDeadline = subscription.cancellation_deadline
    ? daysUntil(subscription.cancellation_deadline)
    : null;

  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 3;
  const isExpiringSoon = daysUntilDeadline !== null && daysUntilDeadline > 3 && daysUntilDeadline <= 7;

  return (
    <div className={`rounded-xl border bg-white p-4 hover:shadow-md transition-shadow ${
      isUrgent ? "border-red-300 bg-red-50/50" : 
      isExpiringSoon ? "border-yellow-300 bg-yellow-50/50" : 
      "border-gray-200"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{subscription.name}</h3>
          {subscription.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {subscription.description}
            </p>
          )}
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onEdit(subscription)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Bewerken"
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => onDelete(subscription.id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Verwijderen"
          >
            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
          </button>
        </div>
      </div>

      {/* Category and Status Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(subscription.category)}`}
        >
          <span>{getCategoryIcon(subscription.category)}</span>
          <span className="capitalize">{subscription.category || "other"}</span>
        </span>
        
        <StatusBadge status={subscription.status} />
      </div>

      {/* Urgent Deadline Warning */}
      {daysUntilDeadline !== null && daysUntilDeadline >= 0 && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-3 ${
            isUrgent
              ? "bg-red-100 text-red-700 border border-red-200"
              : isExpiringSoon
              ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
              : "bg-blue-100 text-blue-700 border border-blue-200"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>
            {isUrgent ? "Urgente" : isExpiringSoon ? "Binnenkort" : ""} opzegtermijn: nog {daysUntilDeadline} dag
            {daysUntilDeadline !== 1 ? "en" : ""}
          </span>
        </div>
      )}

      {/* Cost and Billing Info */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
        <div>
          <div className="flex items-center gap-1 text-gray-600 mb-1">
            <Euro className="w-3 h-3" />
            <span className="text-xs">Kosten</span>
          </div>
          <div className="font-semibold text-gray-900">
            {EUR(subscription.cost_cents)}{" "}
            <span className="text-gray-500 font-normal text-sm">
              {formatBillingCycle(subscription.billing_cycle)}
            </span>
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-1 text-gray-600 mb-1">
            <Calendar className="w-3 h-3" />
            <span className="text-xs">Volgende betaling</span>
          </div>
          <div className="font-semibold text-gray-900 text-sm">
            {subscription.next_billing_date
              ? new Date(subscription.next_billing_date).toLocaleDateString("nl-NL")
              : "-"}
          </div>
        </div>
      </div>

      {/* Cancellation Period */}
      {subscription.cancellation_period_days && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Opzegtermijn: {subscription.cancellation_period_days} dagen voor verlengdatum</span>
          </div>
        </div>
      )}

      {/* Notes */}
      {subscription.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
          <div className="flex items-start gap-1">
            <span className="text-gray-400 mt-0.5">📝</span>
            <span className="line-clamp-2">{subscription.notes}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function SubscriptionListItem({
  subscription,
  onEdit,
  onDelete,
}: {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
}) {
  const daysUntilDeadline = subscription.cancellation_deadline
    ? daysUntil(subscription.cancellation_deadline)
    : null;

  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 3;

  return (
    <div className={`bg-white border-2 rounded-lg p-3 hover:shadow-sm transition-shadow ${
      isUrgent ? "border-red-200 bg-red-50/50" : "border-gray-200"
    }`}>
      <div className="flex items-center gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-gray-900">{subscription.name}</h3>
            
            {/* Category Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(subscription.category)}`}
            >
              <span>{getCategoryIcon(subscription.category)}</span>
              <span className="capitalize">{subscription.category || "other"}</span>
            </span>
            
            <StatusBadge status={subscription.status} />
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">
              {EUR(subscription.cost_cents)} {formatBillingCycle(subscription.billing_cycle)}
            </span>
            
            {subscription.next_billing_date && (
              <span>
                Volgende: {new Date(subscription.next_billing_date).toLocaleDateString("nl-NL")}
              </span>
            )}
            
            {daysUntilDeadline !== null && daysUntilDeadline >= 0 && (
              <span className={isUrgent ? "text-red-600 font-medium" : "text-orange-600"}>
                Opzeggen vóór: {daysUntilDeadline} dag{daysUntilDeadline !== 1 ? "en" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(subscription)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Bewerken"
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => onDelete(subscription.id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Verwijderen"
          >
            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    expired: "bg-gray-100 text-gray-700 border-gray-200",
    paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  const labels: Record<string, string> = {
    active: "Actief",
    cancelled: "Opgezegd",
    expired: "Verlopen",
    paused: "Gepauzeerd",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[status] || colors.active}`}
    >
      {labels[status] || status}
    </span>
  );
}

export function EmptySubscriptionState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📋</div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900">Geen abonnementen</h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        Voeg je eerste abonnement toe om kosten en opzegtermijnen bij te houden
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <span>➕</span>
        Abonnement toevoegen
      </button>
    </div>
  );
}
