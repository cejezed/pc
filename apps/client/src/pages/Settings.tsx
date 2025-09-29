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
    <div className="min-h-screen bg-brikx-bg">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-brikx-dark">Instellingen</h1>
          <p className="text-gray-600 mt-1">
            Beheer je data, profiel en voorkeuren
          </p>
        </div>

        {/* Tabs */}
        <div className="card-brikx p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex gap-2 overflow-x-auto">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "export" 
                  ? "bg-brikx-teal text-white shadow-md" 
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("export")}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "import" 
                  ? "bg-brikx-teal text-white shadow-md" 
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("import")}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Import
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "profile" 
                  ? "bg-brikx-teal text-white shadow-md" 
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profiel
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "notifications" 
                  ? "bg-brikx-teal text-white shadow-md" 
                  : "bg-white text-gray-700 hover:bg-gray-100"
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
              <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                message.type === "success" ? "bg-green-50 border-green-200" :
                message.type === "error" ? "bg-red-50 border-red-200" :
                "bg-blue-50 border-blue-200"
              }`}>
                {message.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
                {message.type === "error" && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />}
                {message.type === "info" && <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />}
                <div className={`text-sm ${
                  message.type === "success" ? "text-green-800" :
                  message.type === "error" ? "text-red-800" :
                  "text-blue-800"
                }`}>
                  {message.text}
                </div>
              </div>
            )}

            {/* Export Tab */}
            {activeTab === "export" && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Over Export</p>
                    <p>Exporteer je data naar CSV formaat. Maximaal 5000 rijen per export. Gebruik dit voor backups of data analyse.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecteer dataset
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {ENTITIES.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setEntity(opt.key)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            entity === opt.key
                              ? "border-brikx-teal bg-brikx-teal/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-2xl mb-1">{opt.icon}</div>
                          <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>Geselecteerd: <strong>{ENTITIES.find(e => e.key === entity)?.label}</strong></span>
                    </div>
                    <button
                      onClick={handleExport}
                      disabled={busy}
                      className="btn-brikx-primary inline-flex items-center gap-2"
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
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Belangrijk</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>CSV moet header regel bevatten</li>
                      <li>Met <code className="bg-amber-100 px-1 rounded">id</code> kolom = update bestaande rijen</li>
                      <li>Zonder id = nieuwe rijen aanmaken</li>
                      <li>Download eerst een export als template</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecteer dataset
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {ENTITIES.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setEntity(opt.key)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            entity === opt.key
                              ? "border-brikx-teal bg-brikx-teal/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-2xl mb-1">{opt.icon}</div>
                          <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="block">
                      <div className="mb-2 text-sm font-medium text-gray-700">
                        Upload CSV bestand
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brikx-teal hover:bg-brikx-teal/5 transition-all cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <div className="text-sm text-gray-600">
                          <span className="text-brikx-teal font-medium">Klik om bestand te selecteren</span>
                          <span className="block mt-1 text-xs">of sleep bestand hierheen</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
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
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
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
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p>Deze gegevens worden gebruikt voor facturen en officiële documenten.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-brikx-dark mb-4">Bedrijfsgegevens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bedrijfsnaam
                        </label>
                        <input type="text" className="input-brikx" placeholder="Brikx B.V." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          KVK nummer
                        </label>
                        <input type="text" className="input-brikx" placeholder="12345678" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BTW nummer
                        </label>
                        <input type="text" className="input-brikx" placeholder="NL123456789B01" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IBAN
                        </label>
                        <input type="text" className="input-brikx" placeholder="NL00 BANK 0000 0000 00" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adres
                        </label>
                        <input type="text" className="input-brikx" placeholder="Straatnaam 123, 1234 AB Amsterdam" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-brikx-dark mb-4">Persoonlijke gegevens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Naam
                        </label>
                        <input type="text" className="input-brikx" placeholder="Jan Jansen" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input type="email" className="input-brikx" placeholder="jan@brikx.nl" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefoon
                        </label>
                        <input type="tel" className="input-brikx" placeholder="+31 6 1234 5678" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 flex justify-end gap-3">
                    <button className="btn-brikx-secondary">
                      Annuleren
                    </button>
                    <button className="btn-brikx-primary">
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
                    <h3 className="text-lg font-semibold text-brikx-dark mb-4">Email notificaties</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Budget waarschuwingen", desc: "Ontvang een email bij 80% budget gebruik" },
                        { label: "Factuur vervaldatum", desc: "Herinnering 3 dagen voor vervaldatum" },
                        { label: "Abonnement opzegtermijn", desc: "Alert 30 dagen voor automatische verlenging" },
                        { label: "Weekly summary", desc: "Wekelijks overzicht van je productiviteit" },
                      ].map((item, i) => (
                        <label key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" defaultChecked className="mt-1" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.label}</div>
                            <div className="text-sm text-gray-600">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-brikx-dark mb-4">Push notificaties</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Taak deadlines", desc: "1 dag voor deadline" },
                        { label: "Project updates", desc: "Bij belangrijke project wijzigingen" },
                      ].map((item, i) => (
                        <label key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" defaultChecked className="mt-1" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.label}</div>
                            <div className="text-sm text-gray-600">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6 flex justify-end gap-3">
                    <button className="btn-brikx-secondary">
                      Reset naar standaard
                    </button>
                    <button className="btn-brikx-primary">
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