interface CTSMarkProps {
  size?: number;
  radius?: number;
  bg?: string;
  color?: string;
  accent?: string;
}

export default function CTSMark({
  size = 32,
  radius = 9,
  bg = "var(--inner)",
  color = "#E2231A",
  accent = "#2C6BD6",
}: CTSMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="31" rx={radius} fill={bg} stroke="var(--line)" />
      <rect x="5" y="9" width="22" height="14" rx="5" fill="none" stroke={color} strokeWidth="3.4" />
      <path d="M5 13 H2.5 M27 13 H29.5" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M13.5 22 L16 18 L18.5 22" fill="none" stroke={accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
