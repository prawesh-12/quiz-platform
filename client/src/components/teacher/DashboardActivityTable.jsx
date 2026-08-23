import { formatAverageScore, formatDateLabel, formatNumber } from "@/components/teacher/dashboardFormat";
import { theme } from "@/theme";

const COLUMNS = ["Quiz", "Subject", "Date", "Participants", "Avg Score"];
const ROW_HEIGHT = "52px";

function HeaderRow() {
  return (
    <thead style={{ backgroundColor: theme.bg.content }}>
      <tr className="h-10 border-b" style={{ borderBottomColor: theme.border.default }}>
        {COLUMNS.map((column) => (
          <th
            key={column}
            scope="col"
            className="px-3 text-left text-[12px]"
            style={{ color: theme.text.muted, fontWeight: theme.font.weight.medium }}
          >
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function ActivityRow({ item }) {
  return (
    <tr
      className="border-b transition-colors hover:bg-[var(--ds-bg-card-hover)]"
      style={{ height: ROW_HEIGHT, borderBottomColor: theme.border.light, color: theme.text.secondary }}
    >
      <td
        className="max-w-[220px] truncate px-3 text-[14px]"
        style={{ color: theme.text.primary, fontWeight: theme.font.weight.medium }}
      >
        {item.name}
      </td>
      <td className="px-3 text-[13px]">{item.subject}</td>
      <td className="px-3 text-[13px]">{formatDateLabel(item.date)}</td>
      <td className="px-3 text-[13px]">{formatNumber(item.participantCount)}</td>
      <td
        className="px-3 text-[14px]"
        style={{ color: theme.text.primary, fontWeight: theme.font.weight.semibold }}
      >
        {formatAverageScore(item.averageScore)}
      </td>
    </tr>
  );
}

export default function DashboardActivityTable({ rows }) {
  return (
    <section
      className="flex min-h-0 flex-1 flex-col overflow-hidden border p-4 sm:p-5"
      style={{
        borderRadius: theme.radius.xl,
        borderColor: theme.border.default,
        backgroundColor: theme.bg.card,
        boxShadow: theme.shadow.card,
      }}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2
          className="text-[15px]"
          style={{ color: theme.text.primary, fontWeight: theme.font.weight.semibold }}
        >
          Recent Quiz Activity
        </h2>
        <p className="text-[12px]" style={{ color: theme.text.subtle }}>
          Last {rows.length} quiz(es)
        </p>
      </div>

      <div className="ds-dashboard-table-wrap min-h-0 flex-1 overflow-auto">
        <table className="ds-dashboard-table w-full border-collapse">
          <HeaderRow />
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-b" style={{ height: ROW_HEIGHT, borderBottomColor: theme.border.light }}>
                <td colSpan={COLUMNS.length} className="px-3 text-center text-[13px]" style={{ color: theme.text.muted }}>
                  No quiz activity available yet.
                </td>
              </tr>
            ) : (
              rows.map((item) => <ActivityRow key={item.id} item={item} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
