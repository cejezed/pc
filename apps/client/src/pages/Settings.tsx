import React, { useState } from "react";
import { supabase } from "../supabase";
import { Download, Upload, Info, CheckCircle2, AlertCircle, Loader2, FileText, Database, User, Bell } from "lucide-react";

// Entities die je wilt ondersteunen
const ENTITIES = [
  { key: "projects", label: "Projecten", icon: "📁" },
  { key: "phases", label: "Fases", icon: "📋" },
  { key: "time_entries", label: "Uren", icon: "⏰" },
  { key: "tasks", label: "Taken", icon: "✅" },
  { key: "task_categories", label: "Taakcategorieën", icon: "🏷️" },
  { key: "ideas", label: "Ideeën", icon: "💡" },
  { key: "subscriptions", label: "Abonnementen", icon: "💳" },
] as const;

type EntityKey = typeof ENTITIES[number]["key"];

function toCSV(rows: any[]): string {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => esc(row[h])).join(",")),
  ];
  return lines.join("\n");
}

function parseCSV(csv: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.match(/("([^"]|"")*"|[^,]*)/g)?.filter(Boolean) ?? line.split(",");
    const clean = values.map((v) => {
      let s = v.trim();
      if (s.startsWith('"') && s.endsWith('"')) {
        s = s.slice(1, -1).replace(/""/g, '"');
      }
      return s;
    });
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = clean[i] ?? ""));
    return obj;
  });
  return { headers, rows };
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"import" | "export" | "profile" | "notifications">("export");
  const [entity, setEntity] = useState<EntityKey>("time_entries");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  async function handleExport() {
    setMessage(null);
    setBusy(true);
    try {
      const { data, error } = await supabase.from(entity).select("*").limit(5000);
      if (error) throw error;

      const csv = toCSV(data || []);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${entity}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);

      setMessage({
        type: "success",
        text: `✓ Export voltooid: ${data?.length ?? 0} rijen geëxporteerd uit ${entity}`
      });
    } catch (e: any) {
      setMessage({
        type: "error",
        text: `✗ Export mislukt: ${e?.message || "Onbekende fout"}`
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(file: File) {
    setMessage(null);
    setBusy(true);
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);

      if (headers.length === 0 || rows.length === 0) {
        throw new Error("Lege of ongeldige CSV. Zorg voor een header regel.");
      }

      // Upsert: vereist unieke key (bijv. id)
      const { data, error } = await supabase
        .from(entity)
        .upsert(rows, { onConflict: "id" })
        .select();

      if (error) throw error;

      setMessage({
        type: "success",
        text: `✓ Import voltooid: ${data?.length ?? 0} rijen geïmporteerd in ${entity}`
      });
    } catch (e: any) {
      setMessage({
        type: "error",
        text: `✗ Import mislukt: ${e?.message || "Onbekende fout"}`
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--zeus-bg)]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--zeus-text)]">Instellingen</h1>
          <p className="text-[var(--zeus-text-secondary)] mt-1">
            Beheer je data, profiel en voorkeuren
          </p>
        </div>

        {/* Tabs */}
        <div className="zeus-card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--zeus-border)] bg-[var(--zeus-bg-secondary)] flex gap-2 overflow-x-auto">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === "export"
                  ? "bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]"
                  : "bg-transparent text-[var(--zeus-text-secondary)] hover:bg-[var(--zeus-card-hover)] hover:text-white"
                }`}
              onClick={() => setActiveTab("export")}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === "import"
                  ? "bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]"
                  : "bg-transparent text-[var(--zeus-text-secondary)] hover:bg-[var(--zeus-card-hover)] hover:text-white"
                }`}
              onClick={() => setActiveTab("import")}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Import
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === "profile"
                  ? "bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]"
                  : "bg-transparent text-[var(--zeus-text-secondary)] hover:bg-[var(--zeus-card-hover)] hover:text-white"
                }`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profiel
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === "notifications"
                  ? "bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]"
                  : "bg-transparent text-[var(--zeus-text-secondary)] hover:bg-[var(--zeus-card-hover)] hover:text-white"
                }`}
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Notificaties
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Message Banner */}
            {message && (
              <div className={`flex items-start gap-3 p-4 rounded-lg border ${message.type === "success" ? "bg-green-900/20 border-green-800" :
                  message.type === "error" ? "bg-red-900/20 border-red-800" :
                    "bg-blue-900/20 border-blue-800"
                }`}>
                {message.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />}
                {message.type === "error" && <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />}
                {message.type === "info" && <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />}
                <div className={`text-sm ${message.type === "success" ? "text-green-200" :
                    message.type === "error" ? "text-red-200" :
                      "text-blue-200"
                  }`}>
                  {message.text}
                </div>
              </div>
            )}

            {/* Export Tab */}
            {activeTab === "export" && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-[var(--zeus-card-hover)] border border-[var(--zeus-border)] rounded-lg">
                  <Info className="w-5 h-5 text-[var(--zeus-primary)] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-[var(--zeus-text)]">
                    <p className="font-medium mb-1">Over Export</p>
                    <p className="text-[var(--zeus-text-secondary)]">Exporteer je data naar CSV formaat. Maximaal 5000 rijen per export. Gebruik dit voor backups of data analyse.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                      Selecteer dataset
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {ENTITIES.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setEntity(opt.key)}
                          className={`p-4 rounded-lg border text-left transition-all ${entity === opt.key
                              ? "border-[var(--zeus-primary)] bg-[var(--zeus-primary)]/10"
                              : "border-[var(--zeus-border)] hover:border-[var(--zeus-text-secondary)] bg-[var(--zeus-card)]"
                            }`}
                        >
                          <div className="text-2xl mb-1">{opt.icon}</div>
                          <div className="text-sm font-medium text-[var(--zeus-text)]">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--zeus-border)]">
                    <div className="flex items-center gap-2 text-sm text-[var(--zeus-text-secondary)]">
                      <FileText className="w-4 h-4" />
                      <span>Geselecteerd: <strong className="text-[var(--zeus-text)]">{ENTITIES.find(e => e.key === entity)?.label}</strong></span>
                    </div>
                    <button
                      onClick={handleExport}
                      disabled={busy}
                      className="btn-zeus-primary inline-flex items-center gap-2"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Exporteren...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Exporteer als CSV
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Import Tab */}
            {activeTab === "import" && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-amber-900/20 border border-amber-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-200">
                    <p className="font-medium mb-1">Belangrijk</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-200/80">
                      <li>CSV moet header regel bevatten</li>
                      <li>Met <code className="bg-amber-900/40 px-1 rounded">id</code> kolom = update bestaande rijen</li>
                      <li>Zonder id = nieuwe rijen aanmaken</li>
                      <li>Download eerst een export als template</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                      Selecteer dataset
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {ENTITIES.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setEntity(opt.key)}
                          className={`p-4 rounded-lg border text-left transition-all ${entity === opt.key
                              ? "border-[var(--zeus-primary)] bg-[var(--zeus-primary)]/10"
                              : "border-[var(--zeus-border)] hover:border-[var(--zeus-text-secondary)] bg-[var(--zeus-card)]"
                            }`}
                        >
                          <div className="text-2xl mb-1">{opt.icon}</div>
                          <div className="text-sm font-medium text-[var(--zeus-text)]">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--zeus-border)]">
                    <label className="block">
                      <div className="mb-2 text-sm font-medium text-[var(--zeus-text-secondary)]">
                        Upload CSV bestand
                      </div>
                      <div className="border-2 border-dashed border-[var(--zeus-border)] rounded-lg p-8 text-center hover:border-[var(--zeus-primary)] hover:bg-[var(--zeus-primary)]/5 transition-all cursor-pointer">
                        <Upload className="w-8 h-8 text-[var(--zeus-text-secondary)] mx-auto mb-3" />
                        <div className="text-sm text-[var(--zeus-text-secondary)]">
                          <span className="text-[var(--zeus-primary)] font-medium">Klik om bestand te selecteren</span>
                          <span className="block mt-1 text-xs">of sleep bestand hierheen</span>
                        </div>
                        <div className="text-xs text-[var(--zeus-text-secondary)] opacity-70 mt-2">
                          Alleen .csv bestanden
                        </div>
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImport(f);
                          }}
                        />
                      </div>
                    </label>
                    {busy && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-[var(--zeus-text-secondary)]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Bestand verwerken...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-[var(--zeus-card-hover)] border border-[var(--zeus-border)] rounded-lg">
                  <Info className="w-5 h-5 text-[var(--zeus-primary)] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-[var(--zeus-text)]">
                    <p>Deze gegevens worden gebruikt voor facturen en officiële documenten.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-4">Bedrijfsgegevens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                          Bedrijfsnaam
                        </label>
                        <input type="text" className="input-zeus" placeholder="Brikx B.V." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                          KVK nummer
                        </label>
                        <input type="text" className="input-zeus" placeholder="12345678" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                          BTW nummer
                        </label>
                        <input type="text" className="input-zeus" placeholder="NL123456789B01" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                          IBAN
                        </label>
                        <input type="text" className="input-zeus" placeholder="NL00 BANK 0000 0000 00" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                          Adres
                        </label>
                        <input type="text" className="input-zeus" placeholder="Straatnaam 123, 1234 AB Amsterdam" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--zeus-border)] pt-6">
                    <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-4">Persoonlijke gegevens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                          Naam
                        </label>
                        <input type="text" className="input-zeus" placeholder="Jan Jansen" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                          Email
                        </label>
                        <input type="email" className="input-zeus" placeholder="jan@brikx.nl" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                          Telefoon
                        </label>
                        <input type="tel" className="input-zeus" placeholder="+31 6 1234 5678" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--zeus-border)] pt-6 flex justify-end gap-3">
                    <button className="btn-zeus-secondary">
                      Annuleren
                    </button>
                    <button className="btn-zeus-primary">
                      Opslaan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-4">Email notificaties</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Budget waarschuwingen", desc: "Ontvang een email bij 80% budget gebruik" },
                        { label: "Factuur vervaldatum", desc: "Herinnering 3 dagen voor vervaldatum" },
                        { label: "Abonnement opzegtermijn", desc: "Alert 30 dagen voor automatische verlenging" },
                        { label: "Weekly summary", desc: "Wekelijks overzicht van je productiviteit" },
                      ].map((item, i) => (
                        <label key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--zeus-card-hover)] cursor-pointer transition-colors">
                          <input type="checkbox" defaultChecked className="mt-1 accent-[var(--zeus-primary)]" />
                          <div className="flex-1">
                            <div className="font-medium text-[var(--zeus-text)]">{item.label}</div>
                            <div className="text-sm text-[var(--zeus-text-secondary)]">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[var(--zeus-border)] pt-6">
                    <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-4">Push notificaties</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Taak deadlines", desc: "1 dag voor deadline" },
                        { label: "Project updates", desc: "Bij belangrijke project wijzigingen" },
                      ].map((item, i) => (
                        <label key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--zeus-card-hover)] cursor-pointer transition-colors">
                          <input type="checkbox" defaultChecked className="mt-1 accent-[var(--zeus-primary)]" />
                          <div className="flex-1">
                            <div className="font-medium text-[var(--zeus-text)]">{item.label}</div>
                            <div className="text-sm text-[var(--zeus-text-secondary)]">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[var(--zeus-border)] pt-6 flex justify-end gap-3">
                    <button className="btn-zeus-secondary">
                      Reset naar standaard
                    </button>
                    <button className="btn-zeus-primary">
                      Voorkeuren opslaan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
