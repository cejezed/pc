import React from 'react';

type SvgProps = { className?: string };

// Shared colors
const BODY = '#475569';   // slate-600
const ACCENT = '#2D9CDB'; // brikx-teal
const FLOOR = '#CBD5E1';  // slate-300

// ─── 1. Pendulum Swings ───────────────────────────────────
// Figure leaning on table, arm hanging, circular arrow
export const PendulumSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Table */}
    <rect x="70" y="30" width="45" height="4" rx="2" fill={FLOOR} />
    <line x1="75" y1="34" x2="75" y2="90" stroke={FLOOR} strokeWidth="3" />
    <line x1="110" y1="34" x2="110" y2="90" stroke={FLOOR} strokeWidth="3" />
    {/* Body - leaning forward */}
    <circle cx="55" cy="18" r="8" stroke={BODY} strokeWidth="2.5" />
    {/* Torso - angled */}
    <line x1="55" y1="26" x2="70" y2="50" stroke={BODY} strokeWidth="2.5" />
    {/* Support arm on table */}
    <line x1="62" y1="36" x2="78" y2="32" stroke={BODY} strokeWidth="2.5" />
    {/* Legs */}
    <line x1="70" y1="50" x2="80" y2="88" stroke={BODY} strokeWidth="2.5" />
    <line x1="70" y1="50" x2="60" y2="88" stroke={BODY} strokeWidth="2.5" />
    {/* Hanging arm */}
    <line x1="58" y1="36" x2="40" y2="65" stroke={ACCENT} strokeWidth="2.5" />
    <circle cx="40" cy="68" r="2" fill={ACCENT} />
    {/* Circular arrow showing swing */}
    <path d="M 30 68 A 12 12 0 1 1 50 68" stroke={ACCENT} strokeWidth="1.5" strokeDasharray="3 2" />
    <polygon points="28,65 30,71 34,66" fill={ACCENT} />
    {/* Floor */}
    <line x1="5" y1="90" x2="115" y2="90" stroke={FLOOR} strokeWidth="1.5" />
  </svg>
);

// ─── 2. Borststretch (deuropening) ────────────────────────
// Figure in doorway, arms on frame at 90°
export const BorststretchSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Door frame */}
    <line x1="20" y1="5" x2="20" y2="95" stroke={FLOOR} strokeWidth="4" />
    <line x1="100" y1="5" x2="100" y2="95" stroke={FLOOR} strokeWidth="4" />
    <line x1="18" y1="5" x2="102" y2="5" stroke={FLOOR} strokeWidth="3" />
    {/* Head */}
    <circle cx="60" cy="22" r="7" stroke={BODY} strokeWidth="2.5" />
    {/* Torso */}
    <line x1="60" y1="29" x2="60" y2="58" stroke={BODY} strokeWidth="2.5" />
    {/* Arms on door frame - 90° angle */}
    <line x1="60" y1="36" x2="22" y2="36" stroke={ACCENT} strokeWidth="2.5" />
    <line x1="22" y1="36" x2="22" y2="18" stroke={ACCENT} strokeWidth="2.5" />
    <line x1="60" y1="36" x2="98" y2="36" stroke={ACCENT} strokeWidth="2.5" />
    <line x1="98" y1="36" x2="98" y2="18" stroke={ACCENT} strokeWidth="2.5" />
    {/* Step forward arrow */}
    <path d="M 60 58 L 60 70" stroke={ACCENT} strokeWidth="1.5" strokeDasharray="3 2" />
    <polygon points="56,68 60,74 64,68" fill={ACCENT} />
    {/* Legs */}
    <line x1="60" y1="58" x2="50" y2="88" stroke={BODY} strokeWidth="2.5" />
    <line x1="60" y1="58" x2="70" y2="88" stroke={BODY} strokeWidth="2.5" />
    {/* Floor */}
    <line x1="5" y1="92" x2="115" y2="92" stroke={FLOOR} strokeWidth="1.5" />
  </svg>
);

// ─── 3. Latissimus Stretch ────────────────────────────────
// Figure side-leaning, arm overhead gripping a post
export const LatStretchSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Door/post */}
    <line x1="25" y1="5" x2="25" y2="95" stroke={FLOOR} strokeWidth="4" />
    {/* Head */}
    <circle cx="55" cy="22" r="7" stroke={BODY} strokeWidth="2.5" />
    {/* Torso - slightly curved away */}
    <path d="M 55 29 Q 60 50 65 65" stroke={BODY} strokeWidth="2.5" fill="none" />
    {/* Arm overhead gripping post */}
    <path d="M 55 34 Q 40 15 27 12" stroke={ACCENT} strokeWidth="2.5" fill="none" />
    <circle cx="27" cy="12" r="2" fill={ACCENT} />
    {/* Other arm relaxed */}
    <line x1="58" y1="40" x2="75" y2="55" stroke={BODY} strokeWidth="2" />
    {/* Legs */}
    <line x1="65" y1="65" x2="55" y2="88" stroke={BODY} strokeWidth="2.5" />
    <line x1="65" y1="65" x2="75" y2="88" stroke={BODY} strokeWidth="2.5" />
    {/* Stretch indicator - side body */}
    <path d="M 48 30 Q 42 45 50 60" stroke={ACCENT} strokeWidth="1" strokeDasharray="3 2" />
    <text x="32" y="48" fontSize="7" fill={ACCENT} fontStyle="italic">rek</text>
    {/* Floor */}
    <line x1="5" y1="92" x2="115" y2="92" stroke={FLOOR} strokeWidth="1.5" />
  </svg>
);

// ─── 4. Nek/Upper Trap Stretch ────────────────────────────
// Head tilted to one side, hand gently pressing
export const NekStretchSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Shoulders / torso top */}
    <line x1="35" y1="50" x2="85" y2="50" stroke={BODY} strokeWidth="3" />
    <line x1="60" y1="50" x2="60" y2="90" stroke={BODY} strokeWidth="2.5" />
    {/* Neck */}
    <line x1="60" y1="50" x2="60" y2="35" stroke={BODY} strokeWidth="2.5" />
    {/* Head - tilted */}
    <ellipse cx="48" cy="25" rx="10" ry="11" stroke={BODY} strokeWidth="2.5" transform="rotate(-15 48 25)" />
    {/* Hand on head */}
    <line x1="85" y1="50" x2="85" y2="35" stroke={ACCENT} strokeWidth="2" />
    <path d="M 85 35 Q 75 20 55 18" stroke={ACCENT} strokeWidth="2" fill="none" />
    {/* Gentle press arrow */}
    <polygon points="56,15 52,20 58,20" fill={ACCENT} />
    {/* Stretch indicator on neck */}
    <path d="M 65 35 Q 72 38 68 45" stroke={ACCENT} strokeWidth="1.5" strokeDasharray="2 2" />
    <text x="72" y="42" fontSize="7" fill={ACCENT} fontStyle="italic">rek</text>
    {/* Other arm relaxed */}
    <line x1="35" y1="50" x2="25" y2="70" stroke={BODY} strokeWidth="2" />
  </svg>
);

// ─── 5. Sleeper Stretch ───────────────────────────────────
// Lying on side, bottom arm forward, top hand pushing forearm down
export const SleeperStretchSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Floor / mat */}
    <rect x="5" y="75" width="110" height="3" rx="1.5" fill={FLOOR} />
    {/* Body lying on side */}
    <ellipse cx="30" cy="55" rx="9" ry="10" stroke={BODY} strokeWidth="2.5" />
    {/* Torso horizontal */}
    <line x1="39" y1="58" x2="85" y2="62" stroke={BODY} strokeWidth="2.5" />
    {/* Bottom arm forward (on ground, elbow bent 90°) */}
    <line x1="42" y1="58" x2="42" y2="75" stroke={ACCENT} strokeWidth="2.5" />
    <line x1="42" y1="75" x2="65" y2="75" stroke={ACCENT} strokeWidth="2.5" />
    {/* Forearm being pushed down - the stretch */}
    <line x1="42" y1="75" x2="25" y2="60" stroke={ACCENT} strokeWidth="2.5" strokeDasharray="0" />
    {/* Top hand pushing */}
    <path d="M 55 50 Q 45 55 30 58" stroke={ACCENT} strokeWidth="2" fill="none" />
    <polygon points="30,55 28,61 34,59" fill={ACCENT} />
    {/* Rotation arrow */}
    <path d="M 50 72 A 8 8 0 0 0 35 63" stroke={ACCENT} strokeWidth="1.5" strokeDasharray="3 2" />
    {/* Legs */}
    <line x1="85" y1="62" x2="100" y2="74" stroke={BODY} strokeWidth="2.5" />
    <line x1="85" y1="62" x2="95" y2="74" stroke={BODY} strokeWidth="2" />
  </svg>
);

// ─── 6. Schouders Reset (optrekken/zakken) ────────────────
// Figure with up/down arrows at shoulders
export const SchoudersResetSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Head */}
    <circle cx="60" cy="18" r="8" stroke={BODY} strokeWidth="2.5" />
    {/* Torso */}
    <line x1="60" y1="26" x2="60" y2="60" stroke={BODY} strokeWidth="2.5" />
    {/* Shoulders */}
    <line x1="35" y1="35" x2="85" y2="35" stroke={BODY} strokeWidth="2.5" />
    {/* Arms */}
    <line x1="35" y1="35" x2="30" y2="58" stroke={BODY} strokeWidth="2" />
    <line x1="85" y1="35" x2="90" y2="58" stroke={BODY} strokeWidth="2" />
    {/* Up arrows */}
    <line x1="25" y1="42" x2="25" y2="24" stroke={ACCENT} strokeWidth="2" />
    <polygon points="21,27 25,20 29,27" fill={ACCENT} />
    <line x1="95" y1="42" x2="95" y2="24" stroke={ACCENT} strokeWidth="2" />
    <polygon points="91,27 95,20 99,27" fill={ACCENT} />
    {/* Down arrows */}
    <line x1="25" y1="48" x2="25" y2="66" stroke={ACCENT} strokeWidth="2" />
    <polygon points="21,63 25,70 29,63" fill={ACCENT} />
    <line x1="95" y1="48" x2="95" y2="66" stroke={ACCENT} strokeWidth="2" />
    <polygon points="91,63 95,70 99,63" fill={ACCENT} />
    {/* Legs */}
    <line x1="60" y1="60" x2="50" y2="88" stroke={BODY} strokeWidth="2.5" />
    <line x1="60" y1="60" x2="70" y2="88" stroke={BODY} strokeWidth="2.5" />
    {/* Floor */}
    <line x1="15" y1="92" x2="105" y2="92" stroke={FLOOR} strokeWidth="1.5" />
  </svg>
);

// ─── 7. Chin Tuck ─────────────────────────────────────────
// Side profile, chin tucking back with arrow
export const ChinTuckSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Spine / back */}
    <line x1="60" y1="90" x2="60" y2="40" stroke={BODY} strokeWidth="2.5" />
    {/* Neck */}
    <line x1="60" y1="40" x2="60" y2="28" stroke={BODY} strokeWidth="2.5" />
    {/* Head - side view */}
    <ellipse cx="55" cy="18" rx="14" ry="12" stroke={BODY} strokeWidth="2.5" />
    {/* Eye */}
    <circle cx="46" cy="15" r="1.5" fill={BODY} />
    {/* Chin */}
    <line x1="45" y1="26" x2="48" y2="28" stroke={BODY} strokeWidth="1.5" />
    {/* Arrow showing chin tuck (backward) */}
    <line x1="44" y1="25" x2="56" y2="25" stroke={ACCENT} strokeWidth="2" />
    <polygon points="53,22 59,25 53,28" fill={ACCENT} />
    {/* Ghost position (wrong - forward head) */}
    <ellipse cx="42" cy="18" rx="14" ry="12" stroke={ACCENT} strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
    {/* Shoulders */}
    <line x1="40" y1="42" x2="80" y2="42" stroke={BODY} strokeWidth="2.5" />
    {/* Double chin lines (humorous touch) */}
    <path d="M 52 28 Q 58 32 62 28" stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" />
    <text x="72" y="28" fontSize="6" fill={ACCENT}>goed!</text>
  </svg>
);

// ─── 8. External Rotation met elastiek ────────────────────
// Figure with band, arm at 90° rotating outward
export const ExternalRotationSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Head */}
    <circle cx="60" cy="14" r="7" stroke={BODY} strokeWidth="2.5" />
    {/* Torso */}
    <line x1="60" y1="21" x2="60" y2="55" stroke={BODY} strokeWidth="2.5" />
    {/* Shoulders */}
    <line x1="38" y1="30" x2="82" y2="30" stroke={BODY} strokeWidth="2.5" />
    {/* Left arm - elbow at side, forearm forward */}
    <line x1="38" y1="30" x2="38" y2="50" stroke={BODY} strokeWidth="2" />
    <line x1="38" y1="50" x2="20" y2="50" stroke={BODY} strokeWidth="2" />
    {/* Right arm - elbow at side, forearm rotating outward */}
    <line x1="82" y1="30" x2="82" y2="50" stroke={BODY} strokeWidth="2.5" />
    <line x1="82" y1="50" x2="105" y2="40" stroke={ACCENT} strokeWidth="2.5" />
    {/* Band/elastiek */}
    <line x1="20" y1="50" x2="5" y2="50" stroke={ACCENT} strokeWidth="2" strokeDasharray="4 2" />
    <rect x="2" y="45" width="5" height="10" rx="1" fill={FLOOR} />
    {/* Rotation arrow */}
    <path d="M 90 55 A 12 12 0 0 0 100 38" stroke={ACCENT} strokeWidth="1.5" />
    <polygon points="101,42 103,35 96,37" fill={ACCENT} />
    {/* Elbow indicator - stays at side */}
    <circle cx="82" cy="50" r="3" stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" />
    {/* Legs */}
    <line x1="60" y1="55" x2="50" y2="85" stroke={BODY} strokeWidth="2.5" />
    <line x1="60" y1="55" x2="70" y2="85" stroke={BODY} strokeWidth="2.5" />
    <line x1="10" y1="90" x2="110" y2="90" stroke={FLOOR} strokeWidth="1.5" />
  </svg>
);

// ─── 9. Scapular Retraction (roeibeweging) ────────────────
// Back view, shoulder blades squeezing together
export const ScapularRetractionSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Head (back view) */}
    <circle cx="60" cy="14" r="8" stroke={BODY} strokeWidth="2.5" />
    {/* Neck */}
    <line x1="60" y1="22" x2="60" y2="28" stroke={BODY} strokeWidth="2.5" />
    {/* Back / torso outline */}
    <path d="M 38 28 Q 35 45 38 65 L 82 65 Q 85 45 82 28 Z" stroke={BODY} strokeWidth="2" fill="none" />
    {/* Shoulder blades */}
    <path d="M 45 35 Q 48 50 45 58" stroke={ACCENT} strokeWidth="2.5" />
    <path d="M 75 35 Q 72 50 75 58" stroke={ACCENT} strokeWidth="2.5" />
    {/* Arrows - squeezing together */}
    <line x1="42" y1="46" x2="52" y2="46" stroke={ACCENT} strokeWidth="2" />
    <polygon points="50,43 55,46 50,49" fill={ACCENT} />
    <line x1="78" y1="46" x2="68" y2="46" stroke={ACCENT} strokeWidth="2" />
    <polygon points="70,43 65,46 70,49" fill={ACCENT} />
    {/* Arms pulling */}
    <line x1="38" y1="32" x2="18" y2="45" stroke={BODY} strokeWidth="2" />
    <line x1="18" y1="45" x2="10" y2="38" stroke={BODY} strokeWidth="2" />
    <line x1="82" y1="32" x2="102" y2="45" stroke={BODY} strokeWidth="2" />
    <line x1="102" y1="45" x2="110" y2="38" stroke={BODY} strokeWidth="2" />
    {/* Legs */}
    <line x1="50" y1="65" x2="45" y2="90" stroke={BODY} strokeWidth="2.5" />
    <line x1="70" y1="65" x2="75" y2="90" stroke={BODY} strokeWidth="2.5" />
    <line x1="10" y1="93" x2="110" y2="93" stroke={FLOOR} strokeWidth="1.5" />
  </svg>
);

// ─── 10. Face Pulls ───────────────────────────────────────
// Figure pulling band toward face, elbows high
export const FacePullSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Anchor point */}
    <rect x="2" y="25" width="6" height="14" rx="2" fill={FLOOR} />
    {/* Band */}
    <line x1="8" y1="32" x2="35" y2="28" stroke={ACCENT} strokeWidth="2" strokeDasharray="4 2" />
    <line x1="8" y1="32" x2="35" y2="36" stroke={ACCENT} strokeWidth="2" strokeDasharray="4 2" />
    {/* Head */}
    <circle cx="60" cy="16" r="7" stroke={BODY} strokeWidth="2.5" />
    {/* Torso */}
    <line x1="60" y1="23" x2="60" y2="58" stroke={BODY} strokeWidth="2.5" />
    {/* Arms - elbows high, hands by face */}
    <line x1="60" y1="32" x2="40" y2="28" stroke={BODY} strokeWidth="2.5" />
    <line x1="40" y1="28" x2="35" y2="28" stroke={ACCENT} strokeWidth="2.5" />
    <line x1="60" y1="32" x2="40" y2="36" stroke={BODY} strokeWidth="2.5" />
    <line x1="40" y1="36" x2="35" y2="36" stroke={ACCENT} strokeWidth="2.5" />
    {/* Elbow indicators - high position */}
    <path d="M 38 22 L 40 28 L 34 30" stroke={ACCENT} strokeWidth="1.5" fill="none" />
    <text x="28" y="20" fontSize="6" fill={ACCENT}>hoog</text>
    {/* Pull arrow */}
    <line x1="25" y1="32" x2="15" y2="32" stroke={ACCENT} strokeWidth="1.5" />
    <polygon points="18,29 12,32 18,35" fill={ACCENT} />
    {/* Legs */}
    <line x1="60" y1="58" x2="50" y2="88" stroke={BODY} strokeWidth="2.5" />
    <line x1="60" y1="58" x2="70" y2="88" stroke={BODY} strokeWidth="2.5" />
    <line x1="10" y1="92" x2="110" y2="92" stroke={FLOOR} strokeWidth="1.5" />
  </svg>
);

// ─── 11. Y-Raises (Lower Trap) ───────────────────────────
// Figure arms raised in Y-shape, thumbs up
export const YRaiseSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Head */}
    <circle cx="60" cy="30" r="7" stroke={BODY} strokeWidth="2.5" />
    {/* Torso - slightly leaned forward */}
    <line x1="60" y1="37" x2="60" y2="65" stroke={BODY} strokeWidth="2.5" />
    {/* Arms in Y position */}
    <line x1="60" y1="42" x2="30" y2="12" stroke={ACCENT} strokeWidth="2.5" />
    <line x1="60" y1="42" x2="90" y2="12" stroke={ACCENT} strokeWidth="2.5" />
    {/* Thumbs up indicators */}
    <line x1="30" y1="12" x2="28" y2="5" stroke={ACCENT} strokeWidth="2" />
    <line x1="90" y1="12" x2="92" y2="5" stroke={ACCENT} strokeWidth="2" />
    {/* Y label */}
    <text x="55" y="8" fontSize="10" fill={ACCENT} fontWeight="bold">Y</text>
    {/* Legs */}
    <line x1="60" y1="65" x2="50" y2="90" stroke={BODY} strokeWidth="2.5" />
    <line x1="60" y1="65" x2="70" y2="90" stroke={BODY} strokeWidth="2.5" />
    <line x1="10" y1="95" x2="110" y2="95" stroke={FLOOR} strokeWidth="1.5" />
  </svg>
);

// ─── 12. Ademhaling (buik) ────────────────────────────────
// Lying figure with belly rising/falling arrows
export const AdemhalingSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Mat / surface */}
    <rect x="5" y="72" width="110" height="3" rx="1.5" fill={FLOOR} />
    {/* Head on pillow */}
    <ellipse cx="18" cy="55" rx="10" ry="9" stroke={BODY} strokeWidth="2.5" />
    <path d="M 8 62 Q 5 65 8 68 L 28 68 Q 31 65 28 62" stroke={FLOOR} strokeWidth="2" fill="none" />
    {/* Body lying */}
    <line x1="28" y1="58" x2="90" y2="60" stroke={BODY} strokeWidth="2.5" />
    {/* Belly bump */}
    <path d="M 45 58 Q 55 40 70 58" stroke={ACCENT} strokeWidth="2" fill="none" />
    {/* Breathing arrows */}
    <line x1="57" y1="45" x2="57" y2="32" stroke={ACCENT} strokeWidth="2" />
    <polygon points="53,35 57,28 61,35" fill={ACCENT} />
    <line x1="57" y1="50" x2="57" y2="56" stroke={ACCENT} strokeWidth="1.5" strokeDasharray="2 2" />
    {/* Hand on belly */}
    <path d="M 50 48 L 64 48" stroke={BODY} strokeWidth="2" />
    {/* 4-6 timing */}
    <text x="68" y="35" fontSize="7" fill={ACCENT}>4 in</text>
    <text x="68" y="44" fontSize="7" fill={ACCENT}>6 uit</text>
    {/* Legs */}
    <line x1="90" y1="60" x2="100" y2="72" stroke={BODY} strokeWidth="2.5" />
    <line x1="100" y1="72" x2="105" y2="60" stroke={BODY} strokeWidth="2.5" />
  </svg>
);

// ─── 13. Ergonomie (bureau) ───────────────────────────────
// Figure at desk with correct posture indicators
export const ErgonomieSvg: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 100" fill="none" className={className}>
    {/* Desk */}
    <rect x="50" y="55" width="65" height="3" rx="1.5" fill={FLOOR} />
    <line x1="55" y1="58" x2="55" y2="90" stroke={FLOOR} strokeWidth="2" />
    <line x1="110" y1="58" x2="110" y2="90" stroke={FLOOR} strokeWidth="2" />
    {/* Monitor */}
    <rect x="72" y="32" width="22" height="18" rx="2" stroke={FLOOR} strokeWidth="2" />
    <line x1="83" y1="50" x2="83" y2="55" stroke={FLOOR} strokeWidth="2" />
    {/* Chair */}
    <path d="M 25 50 L 25 80 Q 25 85 30 85 L 45 85 Q 50 85 50 80 L 50 70" stroke={FLOOR} strokeWidth="2" fill="none" />
    {/* Head */}
    <circle cx="42" cy="22" r="7" stroke={BODY} strokeWidth="2.5" />
    {/* Spine - straight */}
    <line x1="42" y1="29" x2="42" y2="60" stroke={BODY} strokeWidth="2.5" />
    {/* Eye level line to monitor */}
    <line x1="49" y1="22" x2="72" y2="22" stroke={ACCENT} strokeWidth="1" strokeDasharray="3 2" />
    <line x1="72" y1="22" x2="72" y2="40" stroke={ACCENT} strokeWidth="1" strokeDasharray="3 2" />
    {/* Arms at desk - elbows close */}
    <line x1="42" y1="38" x2="42" y2="55" stroke={BODY} strokeWidth="2" />
    <line x1="42" y1="55" x2="60" y2="55" stroke={BODY} strokeWidth="2" />
    {/* Elbow indicator */}
    <text x="2" y="50" fontSize="6" fill={ACCENT}>90°</text>
    <path d="M 15 48 L 42 48" stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" />
    {/* Feet on floor */}
    <line x1="42" y1="60" x2="35" y2="85" stroke={BODY} strokeWidth="2.5" />
    <line x1="42" y1="60" x2="48" y2="85" stroke={BODY} strokeWidth="2.5" />
    <line x1="30" y1="85" x2="40" y2="85" stroke={BODY} strokeWidth="2" />
    {/* Floor */}
    <line x1="5" y1="90" x2="115" y2="90" stroke={FLOOR} strokeWidth="1.5" />
  </svg>
);
