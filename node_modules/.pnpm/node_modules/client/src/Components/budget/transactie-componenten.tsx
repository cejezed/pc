import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal, EUR, formatDate, CategoryBadge, todayISO } from "./basis-componenten";
import type { BudgetCategory, Transaction as BudgetTransaction } from "./types";
import { useAddTransaction, useDeleteTransaction } from "./hooks";

/* Transactie Formulier Modal */
export function TransactionFormModal({
  isOpen,
  onClose,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
}) {
  const addTransaction = useAddTransaction();
  
  const [form, setForm] = React.useState({
    category_id: "",
    amount: "",
    description: "",
    transaction_date: todayISO(),
    notes: "",
    is_recurring: false,
    recurring_interval: "monthly" as "monthly" | "yearly" | "weekly",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.category_id || !form.amount || !form.description) {
      return;
    }

    const transaction: Omit<BudgetTransaction, "id" | "created_at" | "updated_at"> = {
      category_id: form.category_id,
      amount_cents: Math.round(parseFloat(form.amount) * 100),
      description: form.description,
      transaction_date: form.transaction_date,
      type: "expense",
      notes: form.notes || undefined,
      recurring: form.is_recurring,
      recurring_interval: form.is_recurring ? form.recurring_interval : undefined,
    };

    addTransaction.mutate(transaction, {
      onSuccess: () => {
        onClose();
        setForm({
          category_id: "",
          amount: "",
          description: "",
          transaction_date: todayISO(),
          notes: "",
          is_recurring: false,
          recurring_interval: "monthly",
        });
      },
    });
  };

  const selectedCategory = categories.find(c => c.id === form.category_id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nieuwe Transactie">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categorie *
          </label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecteer categorie...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <div className="mt-2">
              <CategoryBadge category={selectedCategory} />
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bedrag (€) *
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Omschrijving *
          </label>
          <input
            type="text"
            placeholder="Beschrijf de transactie..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Datum
          </label>
          <input
            type="date"
            value={form.transaction_date}
            onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notities (optioneel)
          </label>
          <textarea
            placeholder="Extra informatie..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Recurring */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="recurring"
            checked={form.is_recurring}
            onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="recurring" className="text-sm text-gray-700">
            Terugkerende transactie
          </label>
        </div>

        {form.is_recurring && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interval
            </label>
            <select
              value={form.recurring_interval}
              onChange={(e) => setForm({ ...form, recurring_interval: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Wekelijks</option>
              <option value="monthly">Maandelijks</option>
              <option value="yearly">Jaarlijks</option>
            </select>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={addTransaction.isPending || !form.category_id || !form.amount || !form.description}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {addTransaction.isPending ? "Toevoegen..." : "Toevoegen"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* Transactie Lijst Component */
export function TransactionList({
  transactions,
  categories,
  onDelete,
}: {
  transactions: BudgetTransaction[];
  categories: BudgetCategory[];
  onDelete?: (id: string) => void;
}) {
  const deleteTransaction = useDeleteTransaction();

  const handleDelete = (id: string) => {
    if (window.confirm("Weet je zeker dat je deze transactie wilt verwijderen?")) {
      deleteTransaction.mutate(id);
      onDelete?.(id);
    }
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  return (
    <div className="space-y-2">
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nog geen transacties</p>
        </div>
      ) : (
        transactions.map((transaction) => {
          const category = getCategoryById(transaction.category_id);
          return (
            <div
              key={transaction.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {category && <CategoryBadge category={category} />}
                    <span className="font-medium text-gray-900">
                      {transaction.description}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{formatDate(transaction.transaction_date)}</span>
                    {transaction.notes && (
                      <span className="italic">"{transaction.notes}"</span>
                    )}
                    {transaction.recurring && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        Terugkerend ({transaction.recurring_interval})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${
                    transaction.type === 'income' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {EUR(Math.abs(transaction.amount_cents))}
                  </span>
                  
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* Quick Add Transaction Component */
export function QuickAddTransaction({
  categories,
  onAdd,
}: {
  categories: BudgetCategory[];
  onAdd?: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleClose = () => {
    setIsOpen(false);
    onAdd?.();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Nieuwe transactie toevoegen
      </button>

      <TransactionFormModal
        isOpen={isOpen}
        onClose={handleClose}
        categories={categories}
      />
    </>
  );
}