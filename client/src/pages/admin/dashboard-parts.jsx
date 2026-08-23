import { theme } from "@/theme";

const KPI_MIN_HEIGHT_PX = 104;
const KPI_ICON_BOX_PX = 32;
const KPI_ICON_PX = 18;
const ROW_HEIGHT_PX = 52;

export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

export function formatAverageScore(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  return `${value.toFixed(1)}%`;
}

export function formatDateLabel(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function KpiCard({ card }) {
  const Icon = card.icon;

  return (
    <article
      className="min-w-0 flex-1 border p-4"
      style={{
        minHeight: KPI_MIN_HEIGHT_PX,
        borderRadius: theme.radius.lg,
        borderColor: theme.border.default,
        backgroundColor: theme.bg.card
      }}
    >
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium leading-tight" style={{ color: theme.text.muted }}>
            {card.label}
          </p>
          <p className="mt-2 text-[28px] font-bold leading-none" style={{ color: theme.text.primary }}>
            {card.value}
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center justify-center"
          style={{
            width: KPI_ICON_BOX_PX,
            height: KPI_ICON_BOX_PX,
            borderRadius: theme.radius.md,
            backgroundColor: card.tone.bg,
            color: card.tone.color
          }}
        >
          <Icon width={KPI_ICON_PX} height={KPI_ICON_PX} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

export function KpiRow({ cards }) {
  return (
    <section className="ds-dashboard-stats-row mb-4 flex shrink-0 gap-3">
      {cards.map((card) => (
        <KpiCard key={card.label} card={card} />
      ))}
    </section>
  );
}

const HEAD_CELL_CLASS = "px-3 text-left text-[12px] font-medium";
const COLUMNS = ["Quiz", "Subject", "Date", "Participants", "Avg Score"];

function ActivityRow({ item }) {
  return (
    <tr
      className="border-b transition-colors hover:bg-[var(--ds-bg-card-hover)]"
      style={{ height: ROW_HEIGHT_PX, borderBottomColor: theme.border.light, color: theme.text.secondary }}
    >
      <td
        className="max-w-[220px] truncate px-3 text-[14px] font-medium"
        style={{ color: theme.text.primary }}
      >
        {item.name}
      </td>
      <td className="px-3 text-[13px]">{item.subject}</td>
      <td className="whitespace-nowrap px-3 text-[13px]">{formatDateLabel(item.date)}</td>
      <td className="px-3 text-[13px]">{formatNumber(item.participantCount)}</td>
      <td className="px-3 text-[14px] font-semibold" style={{ color: theme.text.primary }}>
        {formatAverageScore(item.averageScore)}
      </td>
    </tr>
  );
}

export function RecentQuizActivity({ items }) {
  return (
    <div className="ds-dashboard-table-wrap overflow-x-auto">
      <table className="ds-dashboard-table w-full border-collapse">
        <thead style={{ backgroundColor: theme.bg.content }}>
          <tr className="h-10 border-b" style={{ borderBottomColor: theme.border.default }}>
            {COLUMNS.map((column) => (
              <th key={column} className={HEAD_CELL_CLASS} style={{ color: theme.text.muted }}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr className="border-b" style={{ height: ROW_HEIGHT_PX, borderBottomColor: theme.border.light }}>
              <td colSpan={COLUMNS.length} className="px-3 text-center text-[13px]" style={{ color: theme.text.muted }}>
                No quiz activity available yet.
              </td>
            </tr>
          ) : (
            items.map((item) => <ActivityRow key={item.id} item={item} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
