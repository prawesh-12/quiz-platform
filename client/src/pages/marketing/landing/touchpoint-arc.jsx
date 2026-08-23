import { ACCENT_GRADIENT, CHIP_TINTS, SHADOW_SOFT } from "./tokens";

// Points sampled off the quadratic below, so the nodes sit on the drawn line rather than near it.
const NODES = [
  { left: "8%", top: 155, tint: "sky" },
  { left: "29%", top: 82, tint: "amber" },
  { left: "50%", top: 58, hero: true },
  { left: "71%", top: 82, tint: "mint" },
  { left: "92%", top: 155, tint: "blush" },
];

function ArcNode({ icon: Icon, label, node }) {
  const size = node.hero ? 80 : 64;
  return (
    <div style={{ left: node.left, top: node.top }} className="absolute -translate-x-1/2 -translate-y-1/2">
      <span
        style={node.hero ? { width: size, height: size, backgroundImage: ACCENT_GRADIENT } : { width: size, height: size }}
        className={`flex items-center justify-center rounded-full ${
          node.hero
            ? "text-white shadow-[0_10px_36px_rgba(109,59,239,.36)] ring-8 ring-white/70"
            : `border border-[color:var(--rule)] bg-white ${SHADOW_SOFT}`
        }`}
      >
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${node.hero ? "" : CHIP_TINTS[node.tint]}`}>
          <Icon size={node.hero ? 28 : 20} strokeWidth={1.75} />
        </span>
      </span>
      <p className="absolute left-1/2 mt-3 w-[132px] -translate-x-1/2 text-center text-[13px] leading-snug text-[color:var(--ink-2)]">
        {label}
      </p>
    </div>
  );
}

export default function TouchpointArc({ items }) {
  return (
    <div className="relative mx-auto hidden h-[250px] w-full max-w-[1000px] lg:block" aria-hidden="true">
      <svg viewBox="0 0 1000 220" preserveAspectRatio="none" className="absolute left-0 top-0 h-[220px] w-full" fill="none">
        <path
          d="M80 155 Q500 -40 920 155"
          stroke="var(--rule-strong)"
          strokeWidth="2"
          strokeDasharray="2 8"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {items.map(([icon, label], index) => (
        <ArcNode key={label} icon={icon} label={label} node={NODES[index]} />
      ))}
    </div>
  );
}
