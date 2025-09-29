import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import { Plus, AlertCircle, TrendingUp, Calendar, Euro, Edit2, Trash2, X } from "lucide-react";

// Types - aangepast aan database schema
type Subscription = {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  amount_cents: number;
  annual_amount_cents?: number;
  billing_cycle: string; // 'monthly' | 'quarterly' | 'annual' | 'yearly' | 'one-time'
  category?: string;
  status: string; // 'active' | 'cancelled' | 'paused' | 'trial'
  start_date: string;
  end_date?: string;
  next_billing_date?: string;
  cancellation_deadline_days: number;
  reminder_days: number;
  notes?: string;
  company_name?: string;
  contract_url?: string;
  payment_method?: string;
  auto_renew: boolean;
  priority: number; // 1-5
  created_at: string;
  updated_at: string;
};

// Helpers
const EUR = (cents: number) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

const calculateMonthlyCost = (amountCents: number, billingCycle: string) => {
  switch (billingCycle.toLowerCase()) {
    case "monthly":
      return amountCents;
    case "yearly":
    case "annual":
      return Math.round(amountCents / 12);
    case "quarterly":
      return Math.round(amountCents / 3);
    default:
      return amountCents;
  }
};

const calculateDaysUntilDeadline = (nextBillingDate: string, cancelDays: number) => {
  const billing = new Date(nextBillingDate);
  const deadline = new Date(billing);
  deadline.setDate(deadline.getDate() - cancelDays);
  const today = new Date();
  const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

// Supabase functions
async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data || [];
}

async function createSubscription(subscription: Partial<Subscription>): Promise<Subscription> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      ...subscription,
      user_id: user?.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

export default function Abonnementen() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Queries
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setShowModal(false);
      setEditingSub(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subscription> }) =>
      updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setShowModal(false);
      setEditingSub(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  // Statistics
  const stats = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === "active");
    const totalMonthly = active.reduce(
      (sum, s) => sum + calculateMonthlyCost(s.amount_cents, s.billing_cycle),
      0
    );
    const totalYearly = totalMonthly * 12;

    const deadlines = active
      .filter((s) => s.next_billing_date && s.auto_renew)
      .map((s) => ({
        subscription: s,
        daysUntil: calculateDaysUntilDeadline(s.next_billing_date!, s.cancellation_deadline_days),
      }))
      .filter((d) => d.daysUntil > 0 && d.daysUntil <= d.subscription.reminder_days)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return {
      activeCount: active.length,
      totalMonthly,
      totalYearly,
      deadlines,
    };
  }, [subscriptions]);

  // Filtered subscriptions
  const filtered = useMemo(() => {
    if (filterStatus === "all") return subscriptions;
    return subscriptions.filter((s) => s.status === filterStatus);
  }, [subscriptions, filterStatus]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<Subscription> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      amount_cents: Math.round(parseFloat(formData.get("amount") as string) * 100),
      billing_cycle: formData.get("billing_cycle") as string,
      category: formData.get("category") as string || undefined,
      status: formData.get("status") as string,
      start_date: formData.get("start_date") as string,
      next_billing_date: formData.get("next_billing_date") as string || undefined,
      cancellation_deadline_days: parseInt(formData.get("cancel_days") as string) || 30,
      reminder_days: parseInt(formData.get("reminder_days") as string) || 7,
      notes: formData.get("notes") as string || undefined,
      company_name: formData.get("company") as string || undefined,
      auto_renew: formData.get("auto_renew") === "on",
      priority: parseInt(formData.get("priority") as string) || 3,
    };

    if (editingSub) {
      updateMutation.mutate({ id: editingSub.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Weet je zeker dat je dit abonnement wilt verwijderen?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brikx-bg flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brikx-bg">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brikx-dark">Abonnementen</h1>
            <p className="text-gray-600 mt-1">
              Beheer je abonnementen en opzegtermijnen
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSub(null);
              setShowModal(true);
            }}
            className="btn-brikx-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nieuw abonnement
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-brikx">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-lg bg-brikx-teal/10 text-brikx-teal">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brikx-dark">{stats.activeCount}</div>
            <div className="text-sm text-gray-600">Actieve abonnementen</div>
          </div>

          <div className="card-brikx">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
                <Euro className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brikx-dark">{EUR(stats.totalMonthly)}</div>
            <div className="text-sm text-gray-600">Per maand</div>
          </div>

          <div className="card-brikx">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brikx-dark">{EUR(stats.totalYearly)}</div>
            <div className="text-sm text-gray-600">Per jaar</div>
          </div>

          <div className="card-brikx">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-lg bg-red-500/10 text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brikx-dark">{stats.deadlines.length}</div>
            <div className="text-sm text-gray-600">Opzegtermijnen</div>
          </div>
        </div>

        {/* Deadlines Warning */}
        {stats.deadlines.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-brikx p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  ⚠️ Aankomende opzegtermijnen
                </h3>
                <div className="space-y-2">
                  {stats.deadlines.slice(0, 3).map((deadline) => (
                    <div
                      key={deadline.subscription.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-yellow-800">
                        <strong>{deadline.subscription.name}</strong> moet binnen{" "}
                        <strong>{deadline.daysUntil} dagen</strong> opgezegd worden
                      </span>
                      <button
                        onClick={() => handleEdit(deadline.subscription)}
                        className="text-yellow-700 hover:underline"
                      >
                        Details →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { key: "all", label: "Alle" },
            { key: "active", label: "Actief" },
            { key: "cancelled", label: "Opgezegd" },
            { key: "paused", label: "Gepauzeerd" },
            { key: "trial", label: "Trial" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                filterStatus === tab.key
                  ? "border-brikx-teal font-semibold text-brikx-teal"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subscriptions List */}
        {filtered.length === 0 ? (
          <div className="card-brikx text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Geen abonnementen gevonden
            </h3>
            <p className="text-gray-600 mb-4">
              Begin met het toevoegen van je eerste abonnement
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-brikx-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nieuw abonnement
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((sub) => {
              const monthlyCost = calculateMonthlyCost(sub.amount_cents, sub.billing_cycle);
              return (
                <div key={sub.id} className="card-brikx">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{sub.name}</h3>
                      {sub.company_name && (
                        <p className="text-sm text-gray-600">{sub.company_name}</p>
                      )}
                    </div>
                    <span
                      className={`badge-brikx ${
                        sub.status === "active"
                          ? "badge-success"
                          : sub.status === "trial"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {sub.status === "active" ? "Actief" : 
                       sub.status === "trial" ? "Trial" :
                       sub.status === "cancelled" ? "Opgezegd" : "Gepauzeerd"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Kosten:</span>
                      <span className="font-semibold">{EUR(sub.amount_cents)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Per maand:</span>
                      <span className="font-semibold">{EUR(monthlyCost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cyclus:</span>
                      <span className="text-sm capitalize">{sub.billing_cycle}</span>
                    </div>
                    {sub.next_billing_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Volgende:</span>
                        <span className="text-sm">
                          {new Date(sub.next_billing_date).toLocaleDateString("nl-NL")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(sub)}
                      className="flex-1 btn-brikx-secondary inline-flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="btn-brikx-danger inline-flex items-center justify-center p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-brikx-dark">
                  {editingSub ? "Abonnement bewerken" : "Nieuw abonnement"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingSub(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingSub?.name}
                      className="input-brikx"
                      placeholder="Netflix, Spotify, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrijf
                    </label>
                    <input
                      type="text"
                      name="company"
                      defaultValue={editingSub?.company_name}
                      className="input-brikx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categorie
                    </label>
                    <input
                      type="text"
                      name="category"
                      defaultValue={editingSub?.category}
                      className="input-brikx"
                      placeholder="Streaming, Software, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrag (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      defaultValue={editingSub ? editingSub.amount_cents / 100 : ""}
                      className="input-brikx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cyclus *
                    </label>
                    <select
                      name="billing_cycle"
                      required
                      defaultValue={editingSub?.billing_cycle || "monthly"}
                      className="select-brikx"
                    >
                      <option value="monthly">Maandelijks</option>
                      <option value="quarterly">Kwartaal</option>
                      <option value="annual">Jaarlijks</option>
                      <option value="one-time">Eenmalig</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Startdatum *
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      required
                      defaultValue={editingSub?.start_date}
                      className="input-brikx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Volgende factuur
                    </label>
                    <input
                      type="date"
                      name="next_billing_date"
                      defaultValue={editingSub?.next_billing_date}
                      className="input-brikx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opzegtermijn (dagen)
                    </label>
                    <input
                      type="number"
                      name="cancel_days"
                      defaultValue={editingSub?.cancellation_deadline_days || 30}
                      className="input-brikx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Herinnering (dagen)
                    </label>
                    <input
                      type="number"
                      name="reminder_days"
                      defaultValue={editingSub?.reminder_days || 7}
                      className="input-brikx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={editingSub?.status || "active"}
                      className="select-brikx"
                    >
                      <option value="active">Actief</option>
                      <option value="trial">Trial</option>
                      <option value="cancelled">Opgezegd</option>
                      <option value="paused">Gepauzeerd</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioriteit
                    </label>
                    <select
                      name="priority"
                      defaultValue={editingSub?.priority || 3}
                      className="select-brikx"
                    >
                      <option value="1">1 - Hoog</option>
                      <option value="2">2</option>
                      <option value="3">3 - Gemiddeld</option>
                      <option value="4">4</option>
                      <option value="5">5 - Laag</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="auto_renew"
                        defaultChecked={editingSub?.auto_renew !== false}
                      />
                      <span className="text-sm text-gray-700">Automatisch verlengen</span>
                    </label>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notities
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      defaultValue={editingSub?.notes}
                      className="textarea-brikx"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschrijving
                    </label>
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={editingSub?.description}
                      className="textarea-brikx"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSub(null);
                    }}
                    className="flex-1 btn-brikx-secondary"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 btn-brikx-primary"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Bezig..."
                      : editingSub
                      ? "Opslaan"
                      : "Toevoegen"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}