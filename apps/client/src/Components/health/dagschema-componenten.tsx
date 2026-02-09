import React, { useState, useMemo } from 'react';
import {
  Sunrise,
  Monitor,
  Dumbbell,
  Moon,
  Bike,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  BedDouble,
} from 'lucide-react';
import { getStorageItem, setStorageItem } from '@/lib/utils';

// ─── Helpers ───────────────────────────────────────────────
const todayKey = () => `dagschema-${new Date().toISOString().slice(0, 10)}`;
const dayIndex = () => new Date().getDay(); // 0=zo 1=ma ... 6=za

const VERSTEERK_DAGEN = [1, 3, 5, 0]; // ma, wo, vr, zo
const isVersterkDag = () => VERSTEERK_DAGEN.includes(dayIndex());

const DAG_LABELS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

// ─── Schema data ───────────────────────────────────────────
type Oefening = { id: string; label: string; detail?: string };

const OCHTEND: Oefening[] = [
  { id: 'ocht-1', label: 'Pendulum swings', detail: 'Arm laten hangen, kleine cirkels – 1 min per arm' },
  { id: 'ocht-2', label: 'Borststretch deuropening', detail: '30 sec per kant' },
  { id: 'ocht-3', label: 'Latissimus stretch', detail: '30 sec per kant' },
  { id: 'ocht-4', label: 'Nek/upper trap stretch', detail: '30 sec per kant' },
  { id: 'ocht-5', label: 'Sleeper stretch', detail: '30 sec per kant' },
  { id: 'ocht-6', label: 'Schouders optrekken & laten zakken', detail: '10x' },
  { id: 'ocht-7', label: 'Schouderbladen naar achter', detail: '10x' },
  { id: 'ocht-8', label: '10 rustige ademhalingen', detail: 'Schouders-laag-modus activeren' },
];

const MINI_PAUZE: Oefening[] = [
  { id: 'mini-1', label: '5x langzaam in- en uitademen' },
  { id: 'mini-2', label: 'Schouders bewust laten zakken' },
  { id: 'mini-3', label: 'Chin tuck (kin intrekken)' },
  { id: 'mini-4', label: '10x schouderbladen naar achter' },
];

const VERSTERKEN: Oefening[] = [
  { id: 'ver-1', label: 'External rotations met elastiek', detail: '3 sets van 12–15, pijnvrij' },
  { id: 'ver-2', label: 'Scapular retractions (roeibeweging)', detail: '3x15' },
  { id: 'ver-3', label: 'Face pulls met elastiek', detail: '3x12' },
  { id: 'ver-4', label: 'Lower trap raises (Y-raises)', detail: '3x10' },
];

const AVOND: Oefening[] = [
  { id: 'avond-1', label: 'Pendulum swings & armzwaaien', detail: '3 min rustig' },
  { id: 'avond-2', label: 'Ontspanningsademhaling', detail: '5 min – 4 tellen in, 6 tellen uit' },
  { id: 'avond-3', label: 'Upper trap stretch', detail: '30 sec per kant' },
  { id: 'avond-4', label: 'Borststretch', detail: '30 sec per kant' },
];

const NA_SPORT: Oefening[] = [
  { id: 'sport-1', label: 'Rustig uitfietsen of wandelen', detail: '5 minuten' },
  { id: 'sport-2', label: 'Borststretch', detail: '30 sec' },
  { id: 'sport-3', label: 'Latstretch', detail: '30 sec' },
  { id: 'sport-4', label: 'Rustig ademhalen', detail: '1 minuut' },
];

const ERGONOMIE: Oefening[] = [
  { id: 'ergo-1', label: 'Schouders laag' },
  { id: 'ergo-2', label: 'Ellebogen dicht bij lichaam' },
  { id: 'ergo-3', label: 'Scherm op ooghoogte' },
  { id: 'ergo-4', label: 'Elk uur 1 minuut pauze' },
  { id: 'ergo-5', label: 'Muis dichtbij' },
];

// ─── Types ─────────────────────────────────────────────────
type CheckedMap = Record<string, boolean>;

type SectieConfig = {
  id: string;
  titel: string;
  subtitel: string;
  icon: React.ReactNode;
  iconColor: string;
  items: Oefening[];
  duur: string;
  badge?: string;
};

// ─── Hooks ─────────────────────────────────────────────────
function useChecked() {
  const key = todayKey();
  const [checked, setChecked] = useState<CheckedMap>(() => getStorageItem<CheckedMap>(key, {}));

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setStorageItem(key, next);
      return next;
    });
  };

  return { checked, toggle };
}

// ─── Sub-componenten ───────────────────────────────────────
function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="rounded-2xl border border-[var(--zeus-border)] bg-[var(--zeus-card)] p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[var(--zeus-text)]">
          Voortgang vandaag
        </span>
        <span className="text-sm font-bold text-[var(--zeus-accent)]">
          {done}/{total} voltooid
        </span>
      </div>
      <div className="h-3 rounded-full bg-[var(--zeus-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[var(--zeus-accent)] to-emerald-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct === 100 && (
        <p className="mt-2 text-xs font-medium text-emerald-600">
          Alles afgerond vandaag — goed bezig!
        </p>
      )}
    </div>
  );
}

function CheckItem({
  item,
  done,
  onToggle,
}: {
  item: Oefening;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
        done
          ? 'bg-emerald-50 border border-emerald-200'
          : 'hover:bg-[var(--zeus-border)] border border-transparent'
      }`}
    >
      {done ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        <span
          className={`text-sm font-medium ${
            done ? 'line-through text-emerald-700' : 'text-[var(--zeus-text)]'
          }`}
        >
          {item.label}
        </span>
        {item.detail && (
          <p className="text-xs text-[var(--zeus-text-secondary)] mt-0.5">
            {item.detail}
          </p>
        )}
      </div>
    </button>
  );
}

function Sectie({
  config,
  checked,
  onToggle,
  defaultOpen = false,
}: {
  config: SectieConfig;
  checked: CheckedMap;
  onToggle: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const done = config.items.filter((i) => checked[i.id]).length;
  const total = config.items.length;
  const allDone = done === total;

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors ${
        allDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-[var(--zeus-border)] bg-[var(--zeus-card)]'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 text-left"
      >
        <span className={`shrink-0 ${config.iconColor}`}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--zeus-text)]">{config.titel}</span>
            {config.badge && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--zeus-accent)]/10 text-[var(--zeus-accent)]">
                {config.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--zeus-text-secondary)]">
            {config.subtitel} &middot; {config.duur}
          </p>
        </div>
        <span className="text-xs font-medium text-[var(--zeus-text-secondary)] shrink-0">
          {done}/{total}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[var(--zeus-text-secondary)] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--zeus-text-secondary)] shrink-0" />
        )}
      </button>

      {/* Items */}
      {open && (
        <div className="px-3 pb-3 md:px-4 md:pb-4 space-y-1">
          {config.items.map((item) => (
            <CheckItem
              key={item.id}
              item={item}
              done={!!checked[item.id]}
              onToggle={() => onToggle(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekOverzicht() {
  const today = dayIndex();
  const versterkDagen = new Set(VERSTEERK_DAGEN);

  const rows = [
    { dag: 0, label: 'Zo' },
    { dag: 1, label: 'Ma' },
    { dag: 2, label: 'Di' },
    { dag: 3, label: 'Wo' },
    { dag: 4, label: 'Do' },
    { dag: 5, label: 'Vr' },
    { dag: 6, label: 'Za' },
  ];

  return (
    <div className="rounded-2xl border border-[var(--zeus-border)] bg-[var(--zeus-card)] p-4 md:p-5">
      <h3 className="font-semibold text-[var(--zeus-text)] mb-3">Weekoverzicht</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--zeus-text-secondary)] text-xs">
              <th className="text-left pb-2 pr-3">Dag</th>
              <th className="text-left pb-2 pr-3">Ochtend</th>
              <th className="text-left pb-2 pr-3">Overdag</th>
              <th className="text-left pb-2">Avond</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isToday = r.dag === today;
              const hasVersterken = versterkDagen.has(r.dag);
              return (
                <tr
                  key={r.dag}
                  className={isToday ? 'bg-[var(--zeus-accent)]/5 font-medium' : ''}
                >
                  <td className={`py-1.5 pr-3 ${isToday ? 'text-[var(--zeus-accent)] font-bold' : 'text-[var(--zeus-text)]'}`}>
                    {r.label}
                    {isToday && <span className="ml-1 text-xs">(vandaag)</span>}
                  </td>
                  <td className="py-1.5 pr-3 text-[var(--zeus-text-secondary)]">
                    Routine{hasVersterken ? ' + versterken' : ''}
                  </td>
                  <td className="py-1.5 pr-3 text-[var(--zeus-text-secondary)]">Mini-pauzes</td>
                  <td className="py-1.5 text-[var(--zeus-text-secondary)]">Ontspanning</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SlaaphoudingTips() {
  return (
    <div className="rounded-2xl border border-[var(--zeus-border)] bg-[var(--zeus-card)] p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <BedDouble className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-[var(--zeus-text)]">Slaaphouding</h3>
      </div>
      <ul className="space-y-2 text-sm text-[var(--zeus-text-secondary)]">
        <li className="flex items-start gap-2">
          <span className="text-indigo-400 mt-0.5">&#8226;</span>
          Niet op de pijnlijke schouder slapen
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo-400 mt-0.5">&#8226;</span>
          Kussen voor je borst, arm daarop laten rusten
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo-400 mt-0.5">&#8226;</span>
          Eventueel klein kussen onder oksel
        </li>
      </ul>
    </div>
  );
}

function VerwachtingKaart() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-amber-800">Realistische verwachting</h3>
      </div>
      <ul className="space-y-1.5 text-sm text-amber-700">
        <li><strong>2 weken:</strong> minder stijfheid</li>
        <li><strong>4–6 weken:</strong> duidelijk meer mobiliteit</li>
        <li><strong>8 weken:</strong> merkbaar minder pijn</li>
      </ul>
    </div>
  );
}

function HerinneringenTip() {
  return (
    <div className="rounded-2xl border border-[var(--zeus-border)] bg-[var(--zeus-card)] p-4 md:p-5">
      <h3 className="font-semibold text-[var(--zeus-text)] mb-2">Herinneringen instellen</h3>
      <p className="text-xs text-[var(--zeus-text-secondary)] mb-3">
        Zet 3 vaste alarmen in je telefoon:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { tijd: '08:30', label: 'Ochtendroutine' },
          { tijd: '12:00', label: 'Houding reset' },
          { tijd: '20:30', label: 'Avondroutine' },
        ].map((a) => (
          <div
            key={a.tijd}
            className="flex items-center gap-2 rounded-xl border border-[var(--zeus-border)] px-3 py-2"
          >
            <span className="text-sm font-bold text-[var(--zeus-accent)]">{a.tijd}</span>
            <span className="text-xs text-[var(--zeus-text-secondary)]">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hoofdcomponent ────────────────────────────────────────
export function DagschemaTab() {
  const { checked, toggle } = useChecked();

  const secties: SectieConfig[] = useMemo(() => {
    const base: SectieConfig[] = [
      {
        id: 'ochtend',
        titel: 'Ochtendritueel',
        subtitel: 'Lichaam wakker maken',
        icon: <Sunrise className="w-5 h-5" />,
        iconColor: 'text-orange-500',
        items: OCHTEND,
        duur: '10 min',
      },
      {
        id: 'mini',
        titel: 'Mini-pauzes werkdag',
        subtitel: 'Elk uur – 60 seconden',
        icon: <Monitor className="w-5 h-5" />,
        iconColor: 'text-blue-500',
        items: MINI_PAUZE,
        duur: '1 min per uur',
      },
    ];

    if (isVersterkDag()) {
      base.push({
        id: 'versterken',
        titel: 'Versterken',
        subtitel: 'External rotaties, retractions, face pulls',
        icon: <Dumbbell className="w-5 h-5" />,
        iconColor: 'text-green-500',
        items: VERSTERKEN,
        duur: '12 min',
        badge: 'Vandaag!',
      });
    }

    base.push({
      id: 'avond',
      titel: 'Avondritueel',
      subtitel: 'Herstel & ontspanning',
      icon: <Moon className="w-5 h-5" />,
      iconColor: 'text-indigo-500',
      items: AVOND,
      duur: '8–10 min',
    });

    base.push({
      id: 'sport',
      titel: 'Na sport (optioneel)',
      subtitel: 'Na MTB of golf',
      icon: <Bike className="w-5 h-5" />,
      iconColor: 'text-teal-500',
      items: NA_SPORT,
      duur: '5 min',
    });

    return base;
  }, []);

  // All checkable items for progress
  const allItems = useMemo(
    () => [...secties.flatMap((s) => s.items), ...ERGONOMIE],
    [secties],
  );
  const doneCount = allItems.filter((i) => checked[i.id]).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <ProgressBar done={doneCount} total={allItems.length} />

      {/* Niet-versterkdag melding */}
      {!isVersterkDag() && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
          <Dumbbell className="w-4 h-4 text-slate-400" />
          Vandaag geen versterkingsoefeningen — rustdag!
          <span className="ml-auto text-xs text-slate-400">
            Volgende: {DAG_LABELS[VERSTEERK_DAGEN.find((d) => d > dayIndex()) ?? VERSTEERK_DAGEN[0]]}
          </span>
        </div>
      )}

      {/* Secties */}
      {secties.map((s, i) => (
        <Sectie
          key={s.id}
          config={s}
          checked={checked}
          onToggle={toggle}
          defaultOpen={i === 0}
        />
      ))}

      {/* Ergonomie checklist */}
      <Sectie
        config={{
          id: 'ergonomie',
          titel: 'Ergonomie checklist',
          subtitel: 'Plak dit op je bureau',
          icon: <Monitor className="w-5 h-5" />,
          iconColor: 'text-cyan-500',
          items: ERGONOMIE,
          duur: 'doorlopend',
        }}
        checked={checked}
        onToggle={toggle}
      />

      {/* Weekoverzicht */}
      <WeekOverzicht />

      {/* Info kaarten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SlaaphoudingTips />
        <VerwachtingKaart />
      </div>

      {/* Herinneringen */}
      <HerinneringenTip />
    </div>
  );
}
