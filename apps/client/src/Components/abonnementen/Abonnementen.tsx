import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import { 
  Plus, AlertCircle, TrendingUp, Calendar, Euro, Edit2, Trash2, X, 
  Download, Search, Filter, Grid, List, Bell, Clock, CreditCard,
  ChevronDown, BarChart3, ArrowUpDown
} from "lucide-react";

// ============================================
// TYPES - Consistent Schema
// ============================================
type Subscription = {
  id: string;
  name: string;
  description?: string;
  amount_cents: number;
  billing_cycle: "monthly" | "yearly" | "quarterly" | "weekly";
  category?: string;
  status: "active" | "cancelled" | "paused" | "trial";
  start_date: string;
  next_billing_date?: string;
  cancellation_deadline_days: number;
  reminder_days: number;
  notes?: string;
  company_name?: string;
  payment_method?: string;
  auto_renew: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
};

// ============================================
// HELPERS
// ============================================
const EUR = (cents: number) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

const calculateMonthlyCost = (amountCents: number, billingCycle: string) => {
  switch (billingCycle.toLowerCase()) {
    case "monthly": return amountCents;
    case "yearly": return Math.round(amountCents / 12);
    case "quarterly": return Math.round(amountCents / 3);
    case "weekly": return Math.round(amountCents * 4.33);
    default: return amountCents;
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

const getCategoryIcon = (category?: string) => {
  const icons: Record<string, string> = {
    streaming: "📺",
    software: "💻",
    fitness: "🏋️",
    music: "🎵",
    cloud: "☁️",
    education: "📚",
    utilities: "⚡",
  };
  return icons[category || ""] || "📦";
};

const todayISO = () => new Date().toISOString().split("T")[0];

// ============================================
// MAIN COMPONENT
// ============================================
export default function Abonnementen() {
  const queryClient = useQueryClient();
  
  // State
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "amount" | "date">("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // ============================================
  // QUERIES
  // ============================================
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Subscription[];
    },
    staleTime: 2 * 60 * 1000,
  });

  // ============================================
  // MUTATIONS
  // ============================================
  const createMutation = useMutation({
    mutationFn: async (payload: Partial<Subscription>) => {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setShowModal(false);
      setEditingSub(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Subscription> }) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setShowModal(false);
      setEditingSub(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  // ============================================
  // STATISTICS
  // ============================================
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

    const categories = [...new Set(active.map(s => s.category).filter(Boolean))];

    return {
      activeCount: active.length,
      totalMonthly,
      totalYearly,
      deadlines,
      categories,
    };
  }, [subscriptions]);

  // ============================================
  // FILTERED & SORTED DATA
  // ============================================
  const filteredAndSorted = useMemo(() => {
    let result = subscriptions;

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((s) => s.status === filterStatus);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((s) => s.category === selectedCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.company_name?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return calculateMonthlyCost(b.amount_cents, b.billing_cycle) - 
                 calculateMonthlyCost(a.amount_cents, a.billing_cycle);
        case "date":
          return new Date(b.next_billing_date || b.start_date).getTime() - 
                 new Date(a.next_billing_date || a.start_date).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [subscriptions, filterStatus, selectedCategory, searchQuery, sortBy]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<Subscription> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      amount_cents: Math.round(parseFloat(formData.get("amount") as string) * 100),
      billing_cycle: formData.get("billing_cycle") as any,
      category: formData.get("category") as string || undefined,
      status: formData.get("status") as any,
      start_date: formData.get("start_date") as string,
      next_billing_date: formData.get("next_billing_date") as string || undefined,
      cancellation_deadline_days: parseInt(formData.get("cancel_days") as string) || 30,
      reminder_days: parseInt(formData.get("reminder_days") as string) || 7,
      notes: formData.get("notes") as string || undefined,
      company_name: formData.get("company") as string || undefined,
      payment_method: formData.get("payment_method") as string || undefined,
      auto_renew: formData.get("auto_renew") === "on",
      priority: parseInt(formData.get("priority") as string) || 3,
    };

    if (editingSub) {
      updateMutation.mutate({ id: editingSub.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const exportToCSV = () => {
    const headers = ["Naam", "Bedrijf", "Bedrag", "Cyclus", "Status", "Volgende Factuur", "Categorie"];
    const rows = filteredAndSorted.map((s) => [
      s.name,
      s.company_name || "",
      (s.amount_cents / 100).toString(),
      s.billing_cycle,
      s.status,
      s.next_billing_date || "",
      s.category || "",
    ]);
    
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abonnementen-${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brikx-bg flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-brikx-bg">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brikx-dark">Abonnementen</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Beheer je abonnementen en opzegtermijnen
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 md:px-4 py-2 rounded-brikx font-semibold transition-all inline-flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => {
                setEditingSub(null);
                setShowModal(true);
              }}
              className="bg-brikx-teal hover:bg-brikx-teal-dark text-white px-3 md:px-4 py-2 rounded-brikx font-semibold shadow-lg hover:shadow-brikx transition-all inline-flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nieuw</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white rounded-brikx border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-brikx-teal/10 text-brikx-teal">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-brikx-dark">{stats.activeCount}</div>
            <div className="text-xs md:text-sm text-gray-600">Actieve abonnementen</div>
          </div>

          <div className="bg-white rounded-brikx border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                <Euro className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-brikx-dark">{EUR(stats.totalMonthly)}</div>
            <div className="text-xs md:text-sm text-gray-600">Per maand</div>
          </div>

          <div className="bg-white rounded-brikx border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-brikx-dark">{EUR(stats.totalYearly)}</div>
            <div className="text-xs md:text-sm text-gray-600">Per jaar</div>
          </div>

          <div className="bg-white rounded-brikx border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-brikx-dark">{stats.deadlines.length}</div>
            <div className="text-xs md:text-sm text-gray-600">Opzegtermijnen</div>
          </div>
        </div>

        {/* Deadlines Warning */}
        {stats.deadlines.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-brikx p-3 md:p-4">
            <div className="flex items-start gap-2 md:gap-3">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-yellow-900 mb-2 text-sm md:text-base">
                  Aankomende opzegtermijnen
                </h3>
                <div className="space-y-2">
                  {stats.deadlines.slice(0, 3).map((deadline) => (
                    <div
                      key={deadline.subscription.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs md:text-sm"
                    >
                      <span className="text-yellow-800">
                        <strong>{deadline.subscription.name}</strong> moet binnen{" "}
                        <strong>{deadline.daysUntil} dagen</strong> opgezegd worden
                      </span>
                      <button
                        onClick={() => {
                          setEditingSub(deadline.subscription);
                          setShowModal(true);
                        }}
                        className="text-yellow-700 hover:underline text-left sm:text-right whitespace-nowrap"
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

        {/* Filters & Search */}
        <div className="bg-white rounded-brikx border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek abonnementen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-brikx text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-brikx text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
            >
              <option value="all">Alle categorieën</option>
              {stats.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryIcon(cat)} {cat}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-brikx text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
            >
              <option value="name">Sorteer: Naam</option>
              <option value="amount">Sorteer: Bedrag</option>
              <option value="date">Sorteer: Datum</option>
            </select>

            {/* View Mode */}
            <div className="flex gap-1 border border-gray-300 rounded-brikx p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${viewMode === "grid" ? "bg-brikx-teal text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${viewMode === "list" ? "bg-brikx-teal text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-px -mb-px scrollbar-hide">
          {[
            { key: "all", label: "Alle" },
            { key: "active", label: "Actief" },
            { key: "trial", label: "Trial" },
            { key: "paused", label: "Gepauzeerd" },
            { key: "cancelled", label: "Opgezegd" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${
                filterStatus === tab.key
                  ? "border-brikx-teal font-semibold text-brikx-teal"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subscriptions List/Grid */}
        {filteredAndSorted.length === 0 ? (
          <div className="bg-white rounded-brikx border border-gray-200 p-6 shadow-sm text-center py-12">
            <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
              Geen abonnementen gevonden
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              {searchQuery || selectedCategory !== "all" 
                ? "Pas je filters aan om resultaten te zien"
                : "Begin met het toevoegen van je eerste abonnement"}
            </p>
            {!searchQuery && selectedCategory === "all" && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-brikx-teal hover:bg-brikx-teal-dark text-white px-4 md:px-6 py-2 md:py-2.5 rounded-brikx font-semibold shadow-lg hover:shadow-brikx transition-all inline-flex items-center gap-2 text-sm md:text-base"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                Nieuw abonnement
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
            : "space-y-3"
          }>
            {filteredAndSorted.map((sub) => {
              const monthlyCost = calculateMonthlyCost(sub.amount_cents, sub.billing_cycle);
              const daysUntil = sub.next_billing_date 
                ? calculateDaysUntilDeadline(sub.next_billing_date, sub.cancellation_deadline_days)
                : null;
              const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3;

              return (
                <div 
                  key={sub.id} 
                  className={`bg-white rounded-brikx border p-4 shadow-sm hover:shadow-md transition-all ${
                    isUrgent ? "border-red-300 bg-red-50/30" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{getCategoryIcon(sub.category)}</span>
                        <h3 className="font-semibold text-base md:text-lg text-gray-900 truncate">
                          {sub.name}
                        </h3>
                      </div>
                      {sub.company_name && (
                        <p className="text-xs md:text-sm text-gray-600 truncate">{sub.company_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          sub.status === "active" ? "bg-green-100 text-green-700" :
                          sub.status === "trial" ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {sub.status === "active" ? "Actief" : 
                         sub.status === "trial" ? "Trial" :
                         sub.status === "cancelled" ? "Opgezegd" : "Gepauzeerd"}
                      </span>
                    </div>
                  </div>

                  {isUrgent && daysUntil !== null && (
                    <div className="bg-red-100 border border-red-200 rounded-lg p-2 mb-3 flex items-center gap-2 text-xs text-red-700">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>Opzegtermijn: nog {daysUntil} dag{daysUntil !== 1 ? "en" : ""}</span>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Kosten:</span>
                      <span className="font-semibold">{EUR(sub.amount_cents)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Per maand:</span>
                      <span className="font-semibold">{EUR(monthlyCost)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Cyclus:</span>
                      <span className="text-sm capitalize">{sub.billing_cycle}</span>
                    </div>
                    {sub.next_billing_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Volgende:</span>
                        <span className="text-sm">
                          {new Date(sub.next_billing_date).toLocaleDateString("nl-NL")}
                        </span>
                      </div>
                    )}
                    {sub.payment_method && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Betaling:</span>
                        <span className="text-sm">{sub.payment_method}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setEditingSub(sub);
                        setShowModal(true);
                      }}
                      className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 hover:border-brikx-teal text-gray-700 px-3 py-1.5 rounded-brikx font-semibold transition-all inline-flex items-center justify-center gap-2 text-sm"
                    >
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Bewerken</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Weet je zeker dat je dit abonnement wilt verwijderen?")) {
                          deleteMutation.mutate(sub.id);
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-brikx font-semibold transition-all inline-flex items-center justify-center text-sm"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-brikx w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-lg md:text-2xl font-bold text-brikx-dark">
                  {editingSub ? "Abonnement bewerken" : "Nieuw abonnement"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingSub(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingSub?.name}
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
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
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categorie
                    </label>
                    <select
                      name="category"
                      defaultValue={editingSub?.category || ""}
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
                    >
                      <option value="">Selecteer...</option>
                      <option value="streaming">Streaming</option>
                      <option value="software">Software</option>
                      <option value="fitness">Fitness</option>
                      <option value="music">Music</option>
                      <option value="cloud">Cloud</option>
                      <option value="education">Education</option>
                      <option value="utilities">Utilities</option>
                    </select>
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
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
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
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
                    >
                      <option value="weekly">Wekelijks</option>
                      <option value="monthly">Maandelijks</option>
                      <option value="quarterly">Kwartaal</option>
                      <option value="yearly">Jaarlijks</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Betaalmethode
                    </label>
                    <select
                      name="payment_method"
                      defaultValue={editingSub?.payment_method || ""}
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
                    >
                      <option value="">Selecteer...</option>
                      <option value="creditcard">Creditcard</option>
                      <option value="ideal">iDEAL</option>
                      <option value="paypal">PayPal</option>
                      <option value="bankoverschrijving">Bankoverschrijving</option>
                      <option value="andere">Andere</option>
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
                      defaultValue={editingSub?.start_date || todayISO()}
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
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
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
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
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
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
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={editingSub?.status || "active"}
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
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
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
                    >
                      <option value="1">1 - Hoog</option>
                      <option value="2">2</option>
                      <option value="3">3 - Gemiddeld</option>
                      <option value="4">4</option>
                      <option value="5">5 - Laag</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="auto_renew"
                        defaultChecked={editingSub?.auto_renew !== false}
                        className="w-4 h-4 rounded border-gray-300 text-brikx-teal focus:ring-brikx-teal"
                      />
                      <span className="text-sm text-gray-700">Automatisch verlengen</span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschrijving
                    </label>
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={editingSub?.description}
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all resize-none"
                      placeholder="Premium plan, Family account..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notities
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      defaultValue={editingSub?.notes}
                      className="w-full border border-gray-300 rounded-brikx px-3 md:px-4 py-2 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all resize-none"
                      placeholder="Extra informatie..."
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSub(null);
                    }}
                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 hover:border-brikx-teal text-gray-700 px-4 md:px-6 py-2 md:py-2.5 rounded-brikx font-semibold transition-all text-sm md:text-base"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-brikx-teal hover:bg-brikx-teal-dark text-white px-4 md:px-6 py-2 md:py-2.5 rounded-brikx font-semibold shadow-lg hover:shadow-brikx transition-all disabled:bg-gray-300 text-sm md:text-base"
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