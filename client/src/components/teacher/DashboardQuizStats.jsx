import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import BookOpenText from "lucide-react/dist/esm/icons/book-open-text";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import Users from "lucide-react/dist/esm/icons/users";

import { formatAverageScore, formatDuration, formatNumber } from "@/components/teacher/dashboardFormat";
import { theme } from "@/theme";

const ICON_SIZE = "h-[26px] w-[26px]";

function buildTiles(quizStats, totalQuizCount, totalAttempts) {
  return [
    { key: "participants", icon: Users, label: "Participants", value: formatNumber(quizStats.participants) },
    { key: "avg-score", icon: BarChart3, label: "Avg Score", value: formatAverageScore(quizStats.averageScore) },
    { key: "avg-time", icon: Clock3, label: "Avg Time", value: formatDuration(quizStats.averageTime) },
    { key: "quiz-name", icon: BookOpenText, label: "Quiz Name", value: quizStats.quizName, isText: true },
    { key: "total-quizzes", label: "Total Quizzes", value: formatNumber(totalQuizCount) },
    { key: "total-attempts", label: "Total Attempts", value: formatNumber(totalAttempts) },
  ];
}

function StatTile({ tile }) {
  const Icon = tile.icon;
  const valueClassName = tile.isText ? "truncate text-[16px] leading-tight" : "text-[18px]";
  const valueWeight = tile.isText ? theme.font.weight.semibold : theme.font.weight.bold;

  return (
    <div
      className="flex w-full flex-col border p-3"
      style={{
        borderRadius: theme.radius.md,
        borderColor: theme.border.default,
        backgroundColor: theme.bg.card,
      }}
    >
      {Icon ? (
        <span className="mb-2 inline-flex items-center" style={{ color: theme.accent.DEFAULT }}>
          <Icon className={ICON_SIZE} />
        </span>
      ) : (
        <span className={`mb-2 ${ICON_SIZE}`} aria-hidden="true" />
      )}
      <p className="text-[12px]" style={{ color: theme.text.muted }}>
        {tile.label}
      </p>
      <p className={valueClassName} style={{ color: theme.text.primary, fontWeight: valueWeight }} title={tile.value}>
        {tile.value}
      </p>
    </div>
  );
}

export default function DashboardQuizStats({ quizStats, totalQuizCount, totalAttempts }) {
  const tiles = buildTiles(quizStats, totalQuizCount, totalAttempts);

  return (
    <article
      className="border p-4 sm:p-5"
      style={{
        borderRadius: theme.radius.xl,
        borderColor: theme.border.default,
        backgroundColor: theme.bg.card,
        boxShadow: theme.shadow.card,
      }}
    >
      <h2
        className="mb-4 text-[15px]"
        style={{ color: theme.text.primary, fontWeight: theme.font.weight.semibold }}
      >
        Quiz Stats
      </h2>
      <div className="grid w-full grid-cols-2 gap-[10px]">
        {tiles.map((tile) => (
          <StatTile key={tile.key} tile={tile} />
        ))}
      </div>
    </article>
  );
}
