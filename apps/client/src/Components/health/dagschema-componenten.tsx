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
  Info,
  X,
  Check,
} from 'lucide-react';
import { getStorageItem, setStorageItem } from '@/lib/utils';
import {
  PendulumSvg,
  BorststretchSvg,
  LatStretchSvg,
  NekStretchSvg,
  SleeperStretchSvg,
  SchoudersResetSvg,
  ChinTuckSvg,
  ExternalRotationSvg,
  ScapularRetractionSvg,
  FacePullSvg,
  YRaiseSvg,
  AdemhalingSvg,
  ErgonomieSvg,
} from './dagschema-illustraties';

// ─── Helpers ───────────────────────────────────────────────
const todayKey = () => `dagschema-${new Date().toISOString().slice(0, 10)}`;
const dayIndex = () => new Date().getDay(); // 0=zo 1=ma ... 6=za

const VERSTEERK_DAGEN = [1, 3, 5, 0]; // ma, wo, vr, zo
const isVersterkDag = () => VERSTEERK_DAGEN.includes(dayIndex());

const DAG_LABELS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

// ─── Types ─────────────────────────────────────────────────
type Instructie = {
  svg: React.FC<{ className?: string }>;
  stappen: string[];
  doen: string[];
  nietDoen: string[];
};

type Oefening = {
  id: string;
  label: string;
  detail?: string;
  instructie?: Instructie;
};

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

// ─── Schema data ───────────────────────────────────────────
const OCHTEND: Oefening[] = [
  {
    id: 'ocht-1',
    label: 'Pendulum swings',
    detail: 'Arm laten hangen, kleine cirkels – 1 min per arm',
    instructie: {
      svg: PendulumSvg,
      stappen: [
        'Leun voorover op een tafel met je goede arm',
        'Laat de pijnlijke arm ontspannen naar beneden hangen',
        'Maak kleine cirkels vanuit je schouder (niet vanuit je hand)',
        '1 minuut met de klok mee, 1 minuut tegen de klok in',
      ],
      doen: [
        'Arm volledig ontspannen laten hangen',
        'Beweging komt vanuit je romp/lichaam',
        'Kleine, gecontroleerde cirkels maken',
      ],
      nietDoen: [
        'Niet actief zwaaien met je arm',
        'Schouder niet optrekken tijdens de oefening',
        'Geen grote cirkels forceren',
      ],
    },
  },
  {
    id: 'ocht-2',
    label: 'Borststretch deuropening',
    detail: '30 sec per kant',
    instructie: {
      svg: BorststretchSvg,
      stappen: [
        'Sta in een deuropening met armen op 90° (elleboog op schouderhoogte)',
        'Onderarmen tegen het deurkozijn plaatsen',
        'Doe een kleine stap naar voren',
        'Houd 30 seconden vast, wissel van voet',
      ],
      doen: [
        'Borst open, schouders naar achteren',
        'Rustig doorademen tijdens de stretch',
        'Lichte rek voelen in borst en voorkant schouder',
      ],
      nietDoen: [
        'Niet te ver doorduwen (geen pijn!)',
        'Schouders niet optrekken naar je oren',
        'Onderrug niet hol trekken',
      ],
    },
  },
  {
    id: 'ocht-3',
    label: 'Latissimus stretch',
    detail: '30 sec per kant',
    instructie: {
      svg: LatStretchSvg,
      stappen: [
        'Pak een deurpost of paal vast op heuphoogte',
        'Doe een stap achteruit en buig je heupen naar achteren',
        'Laat je arm strekken en leun weg van de paal',
        'Voel de rek langs je zij en onder je oksel',
      ],
      doen: [
        'Langzaam en gecontroleerd leunen',
        'Rek voelen in de zijkant van je rug',
        'Heupen naar achteren duwen',
      ],
      nietDoen: [
        'Niet aan de arm trekken of hangen',
        'Schouder niet naar je oor brengen',
        'Niet door scherpe pijn heen stretchen',
      ],
    },
  },
  {
    id: 'ocht-4',
    label: 'Nek/upper trap stretch',
    detail: '30 sec per kant',
    instructie: {
      svg: NekStretchSvg,
      stappen: [
        'Zit of sta rechtop, schouders ontspannen',
        'Kantel je hoofd naar rechts (oor naar schouder)',
        'Leg je rechterhand zachtjes op de linkerkant van je hoofd',
        'Heel lichte druk – voel de rek in je nek/trapezius',
      ],
      doen: [
        'Zeer zachte druk, laat de zwaartekracht het werk doen',
        'Tegenovergestelde schouder bewust laag houden',
        'Rustig ademhalen, 30 sec vasthouden',
      ],
      nietDoen: [
        'NIET trekken of duwen aan je hoofd',
        'Schouder niet optrekken aan de rekzijde',
        'Hoofd niet draaien, alleen kantelen',
      ],
    },
  },
  {
    id: 'ocht-5',
    label: 'Sleeper stretch',
    detail: '30 sec per kant',
    instructie: {
      svg: SleeperStretchSvg,
      stappen: [
        'Ga op je aangedane zij liggen op een mat',
        'Onderarm 90° omhoog (elleboog op schouderhoogte)',
        'Duw met je bovenste hand de onderarm rustig naar de grond',
        'Voel de rek achter in je schouder (interne rotatie)',
      ],
      doen: [
        'Elleboog op schouderhoogte houden',
        'Zeer langzaam en voorzichtig drukken',
        'Stoppen bij het eerste gevoel van rek',
      ],
      nietDoen: [
        'NIET doorduwen bij pijn',
        'Niet op een harde ondergrond liggen',
        'Schouder niet naar voren laten rollen',
      ],
    },
  },
  {
    id: 'ocht-6',
    label: 'Schouders optrekken & laten zakken',
    detail: '10x',
    instructie: {
      svg: SchoudersResetSvg,
      stappen: [
        'Sta of zit rechtop, armen langs je lichaam',
        'Trek beide schouders op naar je oren (2 sec)',
        'Laat ze bewust zakken en ontspan (3 sec)',
        'Herhaal 10 keer',
      ],
      doen: [
        'Overdrijf het laten zakken – voel het verschil',
        'Adem uit terwijl je schouders laat zakken',
        'Schouders zo laag mogelijk laten vallen',
      ],
      nietDoen: [
        'Niet snel of ritmisch doen – neem de tijd',
        'Nek niet vooruit duwen',
        'Niet vasthouden in de "optrek" stand',
      ],
    },
  },
  {
    id: 'ocht-7',
    label: 'Schouderbladen naar achter',
    detail: '10x',
    instructie: {
      svg: ScapularRetractionSvg,
      stappen: [
        'Sta of zit rechtop, armen langs je lichaam',
        'Knijp je schouderbladen naar elkaar toe (alsof je een potlood ertussen klemt)',
        'Houd 3 seconden vast',
        'Ontspan langzaam – herhaal 10 keer',
      ],
      doen: [
        'Focus op schouderbladen, niet op armen',
        'Borst gaat automatisch naar voren – dat is goed',
        'Rustig ademhalen',
      ],
      nietDoen: [
        'Rug niet hol trekken',
        'Schouders niet optrekken naar je oren',
        'Niet met kracht samenpersen',
      ],
    },
  },
  {
    id: 'ocht-8',
    label: '10 rustige ademhalingen',
    detail: 'Schouders-laag-modus activeren',
    instructie: {
      svg: AdemhalingSvg,
      stappen: [
        'Zit of sta ontspannen, hand op je buik',
        'Adem 4 tellen in door je neus (buik komt naar voren)',
        'Adem 6 tellen uit door je mond',
        'Bij elke uitademing: schouders bewust laten zakken',
      ],
      doen: [
        'Buikademhaling – buik beweegt, borst blijft stil',
        'Uitademing langer dan inademing',
        'Ogen dicht als dat prettig voelt',
      ],
      nietDoen: [
        'Niet te diep inademen (geen hyperventilatie)',
        'Schouders niet optrekken bij inademing',
        'Niet haasten – neem je tijd',
      ],
    },
  },
];

const MINI_PAUZE: Oefening[] = [
  {
    id: 'mini-1',
    label: '5x langzaam in- en uitademen',
    instructie: {
      svg: AdemhalingSvg,
      stappen: [
        'Leun achterover in je stoel, voeten plat op de grond',
        'Adem 4 tellen in door je neus',
        'Adem 6 tellen uit door je mond',
        'Herhaal 5 keer',
      ],
      doen: ['Buikademhaling gebruiken', 'Ogen sluiten als dat kan', 'Schouders laten zakken bij elke uitademing'],
      nietDoen: ['Niet haasten', 'Niet doorgaan met typen tijdens het ademen', 'Borst niet optillen'],
    },
  },
  {
    id: 'mini-2',
    label: 'Schouders bewust laten zakken',
    instructie: {
      svg: SchoudersResetSvg,
      stappen: [
        'Merk op waar je schouders nu zijn (waarschijnlijk hoog!)',
        'Trek ze eerst bewust EXTRA omhoog',
        'Laat ze dan vallen en ontspannen',
        'Voel het verschil',
      ],
      doen: ['Het contrast voelen: hoog vs. laag', 'Uitademen terwijl je loslaat', 'Even in die positie blijven'],
      nietDoen: ['Niet meteen weer gaan typen', 'Niet vergeten om ook je kaak te ontspannen', 'Schouders niet naar voren rollen'],
    },
  },
  {
    id: 'mini-3',
    label: 'Chin tuck (kin intrekken)',
    instructie: {
      svg: ChinTuckSvg,
      stappen: [
        'Zit rechtop, kijk recht vooruit',
        'Trek je kin recht naar achteren (dubbele kin maken)',
        'Houd 5 seconden vast',
        'Ontspan – herhaal 5 keer',
      ],
      doen: [
        'Recht naar achteren bewegen (niet omlaag knikken)',
        'Je wordt een beetje "lelijk" – dat is goed!',
        'Achterhoofd gaat naar achteren',
      ],
      nietDoen: [
        'Niet omhoog of omlaag kijken',
        'Niet je nek forceren',
        'Niet je schouders optrekken',
      ],
    },
  },
  {
    id: 'mini-4',
    label: '10x schouderbladen naar achter',
    instructie: {
      svg: ScapularRetractionSvg,
      stappen: [
        'Zit rechtop in je bureaustoel',
        'Knijp je schouderbladen naar elkaar',
        'Houd 2-3 seconden vast',
        '10 keer herhalen',
      ],
      doen: ['Borst open maken', 'Rustig en gecontroleerd bewegen', 'Combineer met een uitademing'],
      nietDoen: ['Niet met je armen trekken', 'Onderrug niet hol trekken', 'Niet te snel doen'],
    },
  },
];

const VERSTERKEN: Oefening[] = [
  {
    id: 'ver-1',
    label: 'External rotations met elastiek',
    detail: '3 sets van 12–15, pijnvrij',
    instructie: {
      svg: ExternalRotationSvg,
      stappen: [
        'Maak elastiek vast op deurklink (ellebooghoogte)',
        'Sta zijwaarts, pak het elastiek met de buitenste hand',
        'Elleboog tegen je zij, onderarm 90° naar voren',
        'Draai je onderarm naar buiten (van buik af) – langzaam terug',
      ],
      doen: [
        'Elleboog de hele tijd tegen je zij houden',
        'Langzaam en gecontroleerd (3 sec uit, 3 sec terug)',
        'Licht gewicht – je moet 15 reps pijnvrij halen',
      ],
      nietDoen: [
        'Elleboog NIET van je zij laten komen',
        'Niet met je hele lichaam meedraaien',
        'NOOIT door pijn heen werken',
      ],
    },
  },
  {
    id: 'ver-2',
    label: 'Scapular retractions (roeibeweging)',
    detail: '3x15',
    instructie: {
      svg: ScapularRetractionSvg,
      stappen: [
        'Elastiek op deurklink, sta ervoor met armen gestrekt',
        'Trek de ellebogen naar achteren langs je lichaam',
        'Knijp schouderbladen samen op het eindpunt',
        'Langzaam terug – 15 herhalingen',
      ],
      doen: [
        'Focus op schouderbladen samenknijpen',
        'Ellebogen dicht bij je lichaam',
        'Sta rechtop, borst vooruit',
      ],
      nietDoen: [
        'Niet met momentum (ruk) trekken',
        'Schouders niet optrekken',
        'Niet achterover leunen om het makkelijker te maken',
      ],
    },
  },
  {
    id: 'ver-3',
    label: 'Face pulls met elastiek',
    detail: '3x12',
    instructie: {
      svg: FacePullSvg,
      stappen: [
        'Elastiek hoog vastmaken (boven hoofdhoogte)',
        'Pak het elastiek met beide handen, palmen naar je toe',
        'Trek naar je gezicht – ellebogen gaan hoog en wijd',
        'Eindig met handen naast je oren, schouderbladen samen',
      ],
      doen: [
        'Ellebogen HOGER dan je handen houden',
        'Schouderbladen samenknijpen op het eindpunt',
        'Langzaam en gecontroleerd (2 sec trek, 2 sec terug)',
      ],
      nietDoen: [
        'Niet naar je buik trekken (dat is een row)',
        'Niet achterover leunen',
        'Niet te zwaar elastiek gebruiken',
      ],
    },
  },
  {
    id: 'ver-4',
    label: 'Lower trap raises (Y-raises)',
    detail: '3x10',
    instructie: {
      svg: YRaiseSvg,
      stappen: [
        'Sta licht voorovergebogen (45°) of lig op je buik op bed',
        'Armen hangen naar beneden, duimen omhoog',
        'Til je armen op in een Y-vorm (schuin naar boven/buiten)',
        'Houd 2 sec boven, langzaam zakken',
      ],
      doen: [
        'Duimen wijzen omhoog (externe rotatie)',
        'Heel licht gewicht of geen gewicht',
        'Voel de spieren tussen je schouderbladen werken',
      ],
      nietDoen: [
        'Niet hoger tillen dan schouderhoogte',
        'Schouders niet optrekken naar je oren',
        'Niet met momentum zwaaien',
      ],
    },
  },
];

const AVOND: Oefening[] = [
  {
    id: 'avond-1',
    label: 'Pendulum swings & armzwaaien',
    detail: '3 min rustig',
    instructie: {
      svg: PendulumSvg,
      stappen: [
        'Zelfde als de ochtendroutine – leun op tafel',
        'Arm ontspannen laten hangen en kleine cirkels maken',
        'Wissel af met rustig voor-achter zwaaien',
        '3 minuten totaal, heel ontspannen',
      ],
      doen: ['Nog rustiger dan in de ochtend', 'Combineer met diepe ademhaling', 'Focus op loslaten van spanning'],
      nietDoen: ['Niet forceren na een drukke dag', 'Geen grote bewegingen', 'Niet haasten'],
    },
  },
  {
    id: 'avond-2',
    label: 'Ontspanningsademhaling',
    detail: '5 min – 4 tellen in, 6 tellen uit',
    instructie: {
      svg: AdemhalingSvg,
      stappen: [
        'Ga comfortabel liggen of zitten (bed/bank)',
        'Hand op je buik, ogen dicht',
        'Adem 4 tellen in door je neus',
        'Adem 6 tellen uit door je mond – 5 minuten lang',
      ],
      doen: [
        'Langere uitademing activeert je parasympatisch zenuwstelsel',
        'Buik laten rijzen en dalen',
        'Schouders bewust laten zakken bij elke uitademing',
      ],
      nietDoen: [
        'Niet op je telefoon kijken tussendoor',
        'Niet forceren als het ritme niet lukt',
        'Niet te laat sporten hiervoor (verstoort slaap)',
      ],
    },
  },
  {
    id: 'avond-3',
    label: 'Upper trap stretch',
    detail: '30 sec per kant',
    instructie: {
      svg: NekStretchSvg,
      stappen: [
        'Zelfde als ochtendroutine – hoofd kantelen',
        'Heel zachte druk met je hand',
        '30 seconden per kant vasthouden',
        'Focus op het loslaten van de dagspanning in je nek',
      ],
      doen: ['Nog zachter dan in de ochtend', 'Combineer met uitademing', 'Voel de spanning wegebben'],
      nietDoen: ['Niet trekken of duwen', 'Niet te lang vasthouden (30 sec is genoeg)', 'Niet draaien'],
    },
  },
  {
    id: 'avond-4',
    label: 'Borststretch',
    detail: '30 sec per kant',
    instructie: {
      svg: BorststretchSvg,
      stappen: [
        'Deuropening stretch – zelfde als ochtend',
        'Armen op 90° tegen deurkozijn',
        'Klein stapje naar voren, voel de rek',
        '30 seconden vasthouden, dan wisselen',
      ],
      doen: ['Rustig en diep ademhalen', 'Ontspannen houding', 'Lichte rek is voldoende'],
      nietDoen: ['Niet te ver doorduwen', 'Niet je rug hol trekken', 'Geen pijn tolereren'],
    },
  },
];

const NA_SPORT: Oefening[] = [
  {
    id: 'sport-1',
    label: 'Rustig uitfietsen of wandelen',
    detail: '5 minuten',
    instructie: {
      svg: AdemhalingSvg,
      stappen: [
        'Na je activiteit (MTB, golf) nog 5 minuten rustig doorbeweging',
        'Fietsen: licht verzet, rustig tempo',
        'Golf: 5 minuten wandelen na het rondje',
        'Hartslag laten dalen, ademhaling normaliseren',
      ],
      doen: ['Heel rustig tempo', 'Schouders bewust ontspannen', 'Diep ademhalen'],
      nietDoen: ['Niet meteen gaan zitten/stoppen', 'Niet snel naar huis rijden', 'Niet overslaan – dit is belangrijk voor herstel'],
    },
  },
  {
    id: 'sport-2',
    label: 'Borststretch',
    detail: '30 sec',
    instructie: {
      svg: BorststretchSvg,
      stappen: [
        'Zoek een muur, paal of deurpost',
        'Arm op 90° tegen de muur',
        'Draai je lichaam weg – voel de rek',
        '30 seconden vasthouden',
      ],
      doen: ['Direct na het sporten doen (spieren zijn warm)', 'Rustig ademen', 'Beide kanten doen'],
      nietDoen: ['Niet bouncen (veren)', 'Niet door pijn heen gaan', 'Niet overslaan omdat je moe bent'],
    },
  },
  {
    id: 'sport-3',
    label: 'Latstretch',
    detail: '30 sec',
    instructie: {
      svg: LatStretchSvg,
      stappen: [
        'Pak een paal of deurkozijn vast',
        'Leun weg met je heupen',
        'Voel de rek in je zij en rug',
        '30 seconden per kant',
      ],
      doen: ['Gebruik het feit dat je spieren warm zijn', 'Langzaam en gecontroleerd', 'Rustig doorademen'],
      nietDoen: ['Niet hangen of trekken', 'Niet door schouderpijn gaan', 'Niet te lang vasthouden'],
    },
  },
  {
    id: 'sport-4',
    label: 'Rustig ademhalen',
    detail: '1 minuut',
    instructie: {
      svg: AdemhalingSvg,
      stappen: [
        'Sta of zit ontspannen, ogen dicht',
        'Adem 4 tellen in, 6 tellen uit',
        '1 minuut lang',
        'Scan je schouders – laat ze zakken',
      ],
      doen: ['Dit sluit je cooldown af', 'Voel je hartslag zakken', 'Waardeer dat je bewogen hebt'],
      nietDoen: ['Niet overslaan', 'Niet meteen je telefoon pakken', 'Niet haasten'],
    },
  },
];

const ERGONOMIE: Oefening[] = [
  {
    id: 'ergo-1',
    label: 'Schouders laag',
    instructie: {
      svg: ErgonomieSvg,
      stappen: ['Check nu: zijn je schouders opgetrokken?', 'Laat ze bewust zakken', 'Ontspan je kaak erbij'],
      doen: ['Elk uur even checken', 'Uitademen en laten zakken'],
      nietDoen: ['Niet doorwerken in een verkrampte houding', 'Niet negeren als je spanning voelt'],
    },
  },
  {
    id: 'ergo-2',
    label: 'Ellebogen dicht bij lichaam',
    instructie: {
      svg: ErgonomieSvg,
      stappen: ['Ellebogen naast je lichaam (niet naar voren of opzij)', 'Onderarmen op het bureau', 'Schouders ontspannen'],
      doen: ['Toetsenbord en muis dichtbij houden', 'Ellebogen op ~90°'],
      nietDoen: ['Armen niet ver naar voren strekken', 'Niet met ellebogen wijd typen'],
    },
  },
  {
    id: 'ergo-3',
    label: 'Scherm op ooghoogte',
    instructie: {
      svg: ErgonomieSvg,
      stappen: ['Bovenkant van je scherm op ooghoogte', 'Gebruik een monitorstandaard of boeken', 'Laptop? Gebruik een extern toetsenbord'],
      doen: ['Recht vooruit kijken naar het scherm', 'Nek in neutrale positie houden'],
      nietDoen: ['Niet omlaag kijken naar een laptop', 'Scherm niet te ver weg zetten'],
    },
  },
  {
    id: 'ergo-4',
    label: 'Elk uur 1 minuut pauze',
    instructie: {
      svg: SchoudersResetSvg,
      stappen: ['Zet een timer of gebruik een app', 'Sta op, rek je uit, beweeg', 'Doe de mini-pauze routine'],
      doen: ['Echt opstaan – niet alleen achterover leunen', 'Combineer met water halen'],
      nietDoen: ['Niet "nog even dit afmaken" en het overslaan', 'Niet 3 uur achter elkaar doorwerken'],
    },
  },
  {
    id: 'ergo-5',
    label: 'Muis dichtbij',
    instructie: {
      svg: ErgonomieSvg,
      stappen: ['Muis direct naast je toetsenbord', 'Je hoeft niet te reiken', 'Overweeg een verticale muis'],
      doen: ['Muis op dezelfde hoogte als toetsenbord', 'Pols recht houden'],
      nietDoen: ['Muis niet ver naar rechts zetten', 'Niet vanuit je schouder reiken naar de muis'],
    },
  },
];

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

function InstructiePanel({ instructie }: { instructie: Instructie }) {
  const Svg = instructie.svg;

  return (
    <div className="mt-2 rounded-xl border border-[var(--zeus-border)] bg-white overflow-hidden">
      {/* Illustratie + stappen */}
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* SVG */}
        <div className="shrink-0 flex items-center justify-center rounded-lg bg-slate-50 p-3 sm:w-36 sm:h-28">
          <Svg className="w-full h-full max-w-[140px] max-h-[100px]" />
        </div>
        {/* Stappen */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--zeus-text)] uppercase tracking-wide mb-2">
            Stap voor stap
          </p>
          <ol className="space-y-1.5">
            {instructie.stappen.map((stap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--zeus-text-secondary)]">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--zeus-accent)]/10 text-[var(--zeus-accent)] text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {stap}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Doen / Niet doen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-[var(--zeus-border)]">
        {/* Doen */}
        <div className="p-3 sm:border-r sm:border-[var(--zeus-border)]">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-2">
            <Check className="w-3.5 h-3.5" /> Wel doen
          </p>
          <ul className="space-y-1">
            {instructie.doen.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-emerald-600">
                <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
        {/* Niet doen */}
        <div className="p-3 border-t sm:border-t-0 border-[var(--zeus-border)]">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-2">
            <X className="w-3.5 h-3.5" /> Niet doen
          </p>
          <ul className="space-y-1">
            {instructie.nietDoen.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-600">
                <span className="text-red-400 mt-0.5 shrink-0">&minus;</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
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
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className={`rounded-xl transition-all ${
        done
          ? 'bg-emerald-50 border border-emerald-200'
          : 'border border-transparent hover:bg-[var(--zeus-border)]'
      }`}
    >
      <div className="flex items-start gap-3 px-3 py-2.5">
        {/* Checkbox */}
        <button onClick={onToggle} className="shrink-0 mt-0.5">
          {done ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
          )}
        </button>

        {/* Label + detail */}
        <div className="flex-1 min-w-0">
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

        {/* Info button */}
        {item.instructie && (
          <button
            onClick={() => setShowInfo((v) => !v)}
            className={`shrink-0 mt-0.5 p-1 rounded-lg transition-colors ${
              showInfo
                ? 'bg-[var(--zeus-accent)]/10 text-[var(--zeus-accent)]'
                : 'text-slate-400 hover:text-[var(--zeus-accent)] hover:bg-[var(--zeus-accent)]/5'
            }`}
            title="Toon instructies"
          >
            {showInfo ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Instruction panel */}
      {showInfo && item.instructie && (
        <div className="px-3 pb-3">
          <InstructiePanel instructie={item.instructie} />
        </div>
      )}
    </div>
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
