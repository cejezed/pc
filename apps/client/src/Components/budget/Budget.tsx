import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import { Plus, TrendingUp, TrendingDown, X, Edit2, Trash2, Wallet } from "lucide-react";
import { Button } from "@/Components/ui/button";

// Types
type BudgetCategory = {
  id: string;
  name: string;
  type: string;
  color?: string;
  icon?: string;
  monthly_budget_cents?: number;
  is_active: boolean;
  user_id?: string;
};

type BudgetTransaction = {
  id: string;
  category_id: string;
  amount_cents: number;
  description: string;
  transaction_date: string;
  notes?: string;
  tags?: string[];
  budget_categories?: BudgetCategory;
  user_id?: string;
};

// Helpers
const EUR = (cents: number) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

// Supabase queries
async function fetchCategories(): Promise<BudgetCategory[]> {
  const { data, error } = await supabase
    .from("budget_categories")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data || [];
}

async function fetchTransactions(): Promise<BudgetTransaction[]> {
  const { data, error } = await supabase
    .from("budget_transactions")
    .select(`
      *,
      budget_categories(*)
    `)
    .order("transaction_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createTransaction(transaction: Partial<BudgetTransaction>): Promise<BudgetTransaction> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("budget_transactions")
    .insert({
      ...transaction,
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from("budget_transactions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

async function createCategory(category: Partial<BudgetCategory>): Promise<BudgetCategory> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("budget_categories")
    .insert({
      ...category,
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export default function Budget() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<"week" | "month" | "year" | "all">("month");
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["budget-categories"],
    queryFn: fetchCategories,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["budget-transactions"],
    queryFn: fetchTransactions,
  });

  // Mutations
  const createTransactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-transactions"] });
      setShowTransactionModal(false);
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-transactions"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
      setShowCategoryModal(false);
    },
  });

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (period === "all") return transactions;

    const now = new Date();
    return transactions.filter((t) => {
      const d = new Date(t.transaction_date);

      if (period === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo;
      }

      if (period === "month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }

      if (period === "year") {
        return d.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [transactions, period]);

  const displayTransactions = useMemo(() => {
    if (!selectedCategory) return filteredTransactions;
    return filteredTransactions.filter(t => t.category_id === selectedCategory);
  }, [filteredTransactions, selectedCategory]);

  // Calculate stats
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.budget_categories?.type === "income")
      .reduce((sum, t) => sum + t.amount_cents, 0);

    const expenses = filteredTransactions
      .filter(t => t.budget_categories?.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0);

    const balance = income - expenses;

    return { income, expenses, balance };
  }, [filteredTransactions]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = categories
      .filter(c => c.is_active)
      .map(category => {
        const categoryTransactions = filteredTransactions.filter(
          t => t.category_id === category.id
        );

        const total = categoryTransactions.reduce(
          (sum, t) => sum + Math.abs(t.amount_cents),
          0
        );

        const percentage = category.type === "expense" && stats.expenses > 0
          ? (total / stats.expenses) * 100
          : 0;

        const budgetUsed = category.monthly_budget_cents && period === "month"
          ? (total / category.monthly_budget_cents) * 100
          : null;

        return {
          category,
          total,
          count: categoryTransactions.length,
          percentage,
          budgetUsed,
        };
      })
      .filter(item => item.count > 0)
      .sort((a, b) => b.total - a.total);

    return breakdown;
  }, [categories, filteredTransactions, stats.expenses, period]);

  const handleTransactionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: Partial<BudgetTransaction> = {
      category_id: formData.get("category_id") as string,
      amount_cents: Math.round(parseFloat(formData.get("amount") as string) * 100),
      description: formData.get("description") as string,
      transaction_date: formData.get("date") as string,
      notes: formData.get("notes") as string,
    };

    createTransactionMutation.mutate(data);
  };

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: Partial<BudgetCategory> = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      color: formData.get("color") as string,
      monthly_budget_cents: formData.get("budget")
        ? Math.round(parseFloat(formData.get("budget") as string) * 100)
        : undefined,
      is_active: true,
    };

    createCategoryMutation.mutate(data);
  };

  if (categoriesLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-[var(--zeus-bg)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--zeus-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--zeus-bg)] text-[var(--zeus-text)]">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--zeus-card)] p-6 rounded-2xl border border-[var(--zeus-border)] shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--zeus-primary)] to-transparent opacity-50"></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--zeus-text)] tracking-tight mb-1 drop-shadow-[0_2px_10px_var(--zeus-primary-glow)] flex items-center gap-3">
              <Wallet className="w-8 h-8 text-[var(--zeus-primary)]" />
              BUDGET <span className="text-[var(--zeus-primary)]">ZEUS-X</span>
            </h1>
            <p className="text-[var(--zeus-text-secondary)] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--zeus-accent)] animate-pulse"></span>
              Beheer je inkomsten en uitgaven
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowCategoryModal(true)}
              className="zeus-button-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Categorie
            </Button>
            <Button
              onClick={() => setShowTransactionModal(true)}
              className="btn-zeus-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Transactie
            </Button>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center justify-between bg-[var(--zeus-card)] p-4 rounded-xl border border-[var(--zeus-border)]">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {(["week", "month", "year", "all"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${period === p
                    ? "bg-[var(--zeus-primary)] text-white shadow-[0_0_10px_var(--zeus-primary-glow)]"
                    : "bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] hover:bg-[var(--zeus-primary)]/10"
                  }`}
              >
                {p === "week" ? "Week" : p === "month" ? "Maand" : p === "year" ? "Jaar" : "Alles"}
              </button>
            ))}
          </div>

          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory("")}
              className="text-sm text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] transition-colors"
            >
              ← Alle categorieën
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg hover:border-[var(--zeus-primary)]/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-lg bg-green-900/20 text-green-400 border border-green-500/20 group-hover:border-green-500/50 transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--zeus-text)]">{EUR(stats.income)}</div>
            <div className="text-sm text-[var(--zeus-text-secondary)]">Inkomen</div>
            <div className="text-xs text-[var(--zeus-text-secondary)]/60 mt-1">
              {filteredTransactions.filter(t => t.budget_categories?.type === "income").length} transacties
            </div>
          </div>

          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg hover:border-[var(--zeus-primary)]/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-lg bg-red-900/20 text-red-400 border border-red-500/20 group-hover:border-red-500/50 transition-colors">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--zeus-text)]">{EUR(stats.expenses)}</div>
            <div className="text-sm text-[var(--zeus-text-secondary)]">Uitgaven</div>
            <div className="text-xs text-[var(--zeus-text-secondary)]/60 mt-1">
              {filteredTransactions.filter(t => t.budget_categories?.type === "expense").length} transacties
            </div>
          </div>

          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg hover:border-[var(--zeus-primary)]/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-3 rounded-lg border transition-colors ${stats.balance >= 0
                  ? "bg-green-900/20 text-green-400 border-green-500/20 group-hover:border-green-500/50"
                  : "bg-red-900/20 text-red-400 border-red-500/20 group-hover:border-red-500/50"
                }`}>
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--zeus-text)]">{EUR(stats.balance)}</div>
            <div className="text-sm text-[var(--zeus-text-secondary)]">Saldo</div>
            <div className={`text-xs mt-1 ${stats.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.balance >= 0 ? "Positief" : "Negatief"}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-[var(--zeus-text)]">Uitgaven per categorie</h2>
            <div className="space-y-3">
              {categoryBreakdown.map(({ category, total, count, percentage, budgetUsed }) => (
                <div
                  key={category.id}
                  className="cursor-pointer hover:bg-[var(--zeus-bg-secondary)] p-3 rounded-lg transition-colors border border-transparent hover:border-[var(--zeus-border)]"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded shadow-[0_0_5px_rgba(0,0,0,0.5)]"
                        style={{ backgroundColor: category.color || "#2D9CDB" }}
                      />
                      <span className="font-medium text-[var(--zeus-text)]">{category.name}</span>
                      <span className="text-sm text-[var(--zeus-text-secondary)]">{count}x</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[var(--zeus-text)]">{EUR(total)}</div>
                      {category.type === "expense" && (
                        <div className="text-xs text-[var(--zeus-text-secondary)]">{percentage.toFixed(1)}%</div>
                      )}
                    </div>
                  </div>

                  {budgetUsed !== null && category.monthly_budget_cents && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-[var(--zeus-text-secondary)] mb-1">
                        <span>Budget: {EUR(category.monthly_budget_cents)}</span>
                        <span className={budgetUsed > 100 ? "text-red-400 font-medium" : ""}>
                          {budgetUsed.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-[var(--zeus-bg-secondary)] rounded-full h-2 overflow-hidden border border-[var(--zeus-border)]">
                        <div
                          className={`h-full rounded-full transition-all ${budgetUsed > 100 ? "bg-red-500" :
                              budgetUsed > 80 ? "bg-yellow-500" : "bg-[var(--zeus-primary)]"
                            }`}
                          style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions list */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-[var(--zeus-text)]">
            {selectedCategory
              ? `${categories.find(c => c.id === selectedCategory)?.name} transacties`
              : "Recente transacties"
            }
          </h2>
          {displayTransactions.length === 0 ? (
            <div className="text-center py-8 text-[var(--zeus-text-secondary)]">
              Geen transacties gevonden
            </div>
          ) : (
            <div className="space-y-2">
              {displayTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-[var(--zeus-bg-secondary)] rounded-lg transition-colors border border-transparent hover:border-[var(--zeus-border)]">
                  <div className="flex-1">
                    <div className="font-medium text-[var(--zeus-text)]">{t.description}</div>
                    <div className="text-sm text-[var(--zeus-text-secondary)]">
                      {new Date(t.transaction_date).toLocaleDateString("nl-NL")}
                      {t.budget_categories && ` • ${t.budget_categories.name}`}
                    </div>
                    {t.notes && (
                      <div className="text-xs text-[var(--zeus-text-secondary)]/60 mt-1">{t.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${t.budget_categories?.type === "income" ? "text-green-400" : "text-red-400"
                      }`}>
                      {t.budget_categories?.type === "income" ? "+" : "-"}{EUR(Math.abs(t.amount_cents))}
                    </span>
                    <button
                      onClick={() => deleteTransactionMutation.mutate(t.id)}
                      className="text-[var(--zeus-text-secondary)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Modal */}
        {showTransactionModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--zeus-card)] rounded-2xl border border-[var(--zeus-border)] shadow-[0_0_50px_var(--zeus-primary-glow)] max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--zeus-text)]">Nieuwe transactie</h2>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                    Categorie *
                  </label>
                  <select name="category_id" required className="w-full px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]">
                    <option value="">Selecteer...</option>
                    {categories.filter(c => c.is_active).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                    Bedrag (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    required
                    className="w-full px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                    Beschrijving *
                  </label>
                  <input
                    type="text"
                    name="description"
                    required
                    className="w-full px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                    Datum *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                    Notities
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(false)}
                    className="flex-1 px-4 py-2 bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] rounded-lg hover:bg-[var(--zeus-bg-secondary)]/80 transition-colors"
                  >
                    Annuleren
                  </button>
                  <Button
                    type="submit"
                    disabled={createTransactionMutation.isPending}
                    className="flex-1 btn-zeus-primary"
                  >
                    {createTransactionMutation.isPending ? "Bezig..." : "Toevoegen"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--zeus-card)] rounded-2xl border border-[var(--zeus-border)] shadow-[0_0_50px_var(--zeus-primary-glow)] max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--zeus-text)]">Nieuwe categorie</h2>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                    Naam *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                    Type *
                  </label>
                  <select name="type" required className="w-full px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]">
                    <option value="expense">Uitgave</option>
                    <option value="income">Inkomen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                    Kleur
                  </label>
                  <input
                    type="color"
                    name="color"
                    defaultValue="#2D9CDB"
                    className="w-full h-12 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                    Maandelijks budget (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="budget"
                    className="w-full px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 px-4 py-2 bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] rounded-lg hover:bg-[var(--zeus-bg-secondary)]/80 transition-colors"
                  >
                    Annuleren
                  </button>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                    className="flex-1 btn-zeus-primary"
                  >
                    {createCategoryMutation.isPending ? "Bezig..." : "Toevoegen"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}