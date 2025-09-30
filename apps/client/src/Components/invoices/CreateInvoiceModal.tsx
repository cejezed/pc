// invoices/CreateInvoiceModal.tsx
import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import type { Project, Phase, TimeEntry } from './types';
import { EUR, todayISO, addDays, formatDate } from './utils';
import { useCreateInvoice } from './hooks';

interface Props {
  projects: Project[];
  phases: Phase[];
  unbilledEntries: TimeEntry[];
  onClose: () => void;
}

export default function CreateInvoiceModal({ 
  projects, 
  phases, 
  unbilledEntries, 
  onClose 
}: Props) {
  const createInvoice = useCreateInvoice();
  const [step, setStep] = useState(1);

  // Form state
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 30));

  // Computed values
  const projectEntries = useMemo(() => {
    if (!selectedProject) return [];
    return unbilledEntries.filter(e => e.project_id === selectedProject);
  }, [unbilledEntries, selectedProject]);

  const selectedEntriesData = useMemo(() => {
    return projectEntries.filter(e => selectedEntries.has(e.id));
  }, [projectEntries, selectedEntries]);

  const totalAmount = useMemo(() => {
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return 0;
    
    const totalMinutes = selectedEntriesData.reduce((sum, e) => sum + e.minutes, 0);
    return Math.round((totalMinutes / 60) * project.default_rate_cents);
  }, [selectedEntriesData, selectedProject, projects]);

  // Handlers
  const toggleEntry = (entryId: string) => {
    const newSet = new Set(selectedEntries);
    if (newSet.has(entryId)) {
      newSet.delete(entryId);
    } else {
      newSet.add(entryId);
    }
    setSelectedEntries(newSet);
  };

  const selectAllEntries = () => {
    setSelectedEntries(new Set(projectEntries.map(e => e.id)));
  };

  const handleSubmit = () => {
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    // Group entries by phase
    const itemsByPhase = new Map<string, TimeEntry[]>();
    selectedEntriesData.forEach(entry => {
      const existing = itemsByPhase.get(entry.phase_code) || [];
      itemsByPhase.set(entry.phase_code, [...existing, entry]);
    });

    const items = Array.from(itemsByPhase.entries()).map(([phaseCode, entries]) => {
      const phase = phases.find(p => p.code === phaseCode);
      const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
      const amount = Math.round((totalMinutes / 60) * project.default_rate_cents);

      return {
        project_id: selectedProject,
        phase_code: phaseCode,
        description: phase?.name || phaseCode,
        quantity_minutes: totalMinutes,
        unit_rate_cents: project.default_rate_cents,
        amount_cents: amount,
      };
    });

    createInvoice.mutate(
      {
        project_id: selectedProject,
        number: invoiceNumber || null,
        issue_date: issueDate,
        due_date: dueDate,
        status: 'draft',
        items,
        time_entry_ids: Array.from(selectedEntries),
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-brikx p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-brikx-dark">Nieuwe Factuur</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  s <= step
                    ? 'bg-brikx-teal text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? 'bg-brikx-teal' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Hours */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selecteer Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedEntries(new Set());
                }}
                className="w-full border border-gray-300 rounded-brikx px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
              >
                <option value="">Kies een project...</option>
                {projects.map(project => {
                  const unbilledCount = unbilledEntries.filter(
                    e => e.project_id === project.id
                  ).length;
                  return (
                    <option key={project.id} value={project.id}>
                      {project.name} {unbilledCount > 0 && `(${unbilledCount} entries)`}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedProject && projectEntries.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-700">Ongefactureerde uren</h4>
                  <button
                    onClick={selectAllEntries}
                    className="text-sm text-brikx-teal hover:text-brikx-teal-dark font-medium"
                  >
                    Alles selecteren
                  </button>
                </div>

                <div className="border border-gray-200 rounded-brikx overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={selectedEntries.size === projectEntries.length}
                            onChange={selectAllEntries}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                          Datum
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                          Fase
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">
                          Uren
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                          Notities
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {projectEntries.map(entry => {
                        const phase = phases.find(p => p.code === entry.phase_code);
                        return (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedEntries.has(entry.id)}
                                onChange={() => toggleEntry(entry.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {formatDate(entry.occurred_on)}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {phase?.name || entry.phase_code}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {(entry.minutes / 60).toFixed(1)}u
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {entry.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <span className="font-semibold">Geselecteerd:</span>{' '}
                    {selectedEntries.size} entries •{' '}
                    {(selectedEntriesData.reduce((s, e) => s + e.minutes, 0) / 60).toFixed(1)} uren •{' '}
                    <span className="font-bold">{EUR(totalAmount)}</span>
                  </div>
                </div>
              </>
            ) : selectedProject ? (
              <div className="text-center py-8 text-gray-500">
                Geen ongefactureerde uren voor dit project
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-brikx hover:bg-gray-50 font-semibold"
              >
                Annuleren
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={selectedEntries.size === 0}
                className="px-6 py-2.5 bg-brikx-teal text-white rounded-brikx hover:bg-brikx-teal-dark disabled:bg-gray-300 font-semibold"
              >
                Volgende
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Invoice Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Factuurnummer (optioneel)
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Auto-generated"
                  className="w-full border border-gray-300 rounded-brikx px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Factuurdatum
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-brikx px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vervaldatum
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-brikx px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
              />
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-brikx hover:bg-gray-50 font-semibold"
              >
                Terug
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-brikx-teal text-white rounded-brikx hover:bg-brikx-teal-dark font-semibold"
              >
                Volgende
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 font-medium mb-1">Project</div>
                  <div className="font-semibold">
                    {projects.find(p => p.id === selectedProject)?.name}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 font-medium mb-1">Factuurnummer</div>
                  <div className="font-semibold">
                    {invoiceNumber || 'Auto-generated'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 font-medium mb-1">Factuurdatum</div>
                  <div className="font-semibold">{formatDate(issueDate)}</div>
                </div>
                <div>
                  <div className="text-gray-600 font-medium mb-1">Vervaldatum</div>
                  <div className="font-semibold">{formatDate(dueDate)}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Factuurregels</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        Omschrijving
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">
                        Uren
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">
                        Bedrag
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Array.from(
                      selectedEntriesData.reduce((map, entry) => {
                        const phase = phases.find(p => p.code === entry.phase_code);
                        const key = entry.phase_code;
                        const existing = map.get(key) || { minutes: 0, phase };
                        map.set(key, {
                          minutes: existing.minutes + entry.minutes,
                          phase,
                        });
                        return map;
                      }, new Map<string, { minutes: number; phase?: Phase }>())
                    ).map(([code, { minutes, phase }]) => {
                      const project = projects.find(p => p.id === selectedProject);
                      const hours = minutes / 60;
                      const amount = Math.round(hours * (project?.default_rate_cents || 0));

                      return (
                        <tr key={code}>
                          <td className="px-4 py-2 text-sm">
                            {phase?.name || code}
                          </td>
                          <td className="px-4 py-2 text-sm text-right">
                            {hours.toFixed(1)}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-semibold">
                            {EUR(amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold" colSpan={2}>
                        Totaal
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold">
                        {EUR(totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-brikx hover:bg-gray-50 font-semibold"
              >
                Terug
              </button>
              <button
                onClick={handleSubmit}
                disabled={createInvoice.isPending}
                className="px-6 py-2.5 bg-brikx-teal text-white rounded-brikx hover:bg-brikx-teal-dark disabled:bg-gray-300 font-semibold"
              >
                {createInvoice.isPending ? 'Aanmaken...' : 'Factuur aanmaken'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
