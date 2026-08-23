import Activity from "lucide-react/dist/esm/icons/activity";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import ClipboardCheck from "lucide-react/dist/esm/icons/clipboard-check";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import Users from "lucide-react/dist/esm/icons/users";

import { formatNumber } from "@/components/teacher/dashboardFormat";
import { cn } from "@/lib/utils";
import { theme } from "@/theme";

const CARD_CLASS = "min-h-[102px] min-w-0 flex-1 border px-5 py-4";
const LONG_LABEL_LENGTH = 20;

function buildCards(stats, onOpenScheduled, onOpenOngoing) {
  const neutralTone = { bg: theme.bg.input, color: theme.text.secondary };
  const accentTone = { bg: theme.accent.tint, color: theme.accent.DEFAULT };

  return [
    {
      label: "Scheduled Quizzes",
      value: stats.scheduledQuizzes,
      icon: CalendarClock,
      tone: { bg: theme.status.pendingTint, color: theme.status.pending },
      onClick: onOpenScheduled,
    },
    {
      label: "Ongoing Quizzes",
      value: stats.ongoingQuizzes,
      icon: Activity,
      tone: { bg: theme.status.activeTint, color: theme.status.active },
      onClick: onOpenOngoing,
    },
    { label: "Total Quiz Attempts Today", value: stats.attemptsToday, icon: ClipboardCheck, tone: accentTone },
    { label: "New Participants Today", value: stats.newParticipantsToday, icon: UserPlus, tone: neutralTone },
    { label: "Total Participants", value: stats.totalParticipants, icon: Users, tone: accentTone },
  ];
}

function KpiCardBody({ card }) {
  const Icon = card.icon;
  const labelFontSize = card.label.length > LONG_LABEL_LENGTH ? "10.5px" : "11px";

  return (
    <div className="flex h-full min-h-[90px] items-start justify-between gap-3">
      <div className="min-w-0">
        <p
          className="leading-tight"
          style={{ fontSize: labelFontSize, color: theme.text.muted, fontWeight: theme.font.weight.medium }}
        >
          {card.label}
        </p>
        <p
          className="mt-2 text-[28px] leading-none"
          style={{ color: theme.text.primary, fontWeight: theme.font.weight.bold }}
        >
          {formatNumber(card.value)}
        </p>
      </div>
      <span
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center"
        style={{ borderRadius: theme.radius.md, backgroundColor: card.tone.bg, color: card.tone.color }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
    </div>
  );
}

export default function DashboardKpiCards({ stats, onOpenScheduled, onOpenOngoing }) {
  const cards = buildCards(stats, onOpenScheduled, onOpenOngoing);
  const cardStyle = {
    borderRadius: theme.radius.xl,
    borderColor: theme.border.default,
    backgroundColor: theme.bg.card,
    boxShadow: theme.shadow.card,
  };

  return (
    <section className="ds-dashboard-stats-row mb-4 flex shrink-0 gap-3">
      {cards.map((card) => {
        if (!card.onClick) {
          return (
            <article key={card.label} className={cn(CARD_CLASS, "cursor-default")} style={cardStyle}>
              <KpiCardBody card={card} />
            </article>
          );
        }

        return (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className={cn(
              CARD_CLASS,
              "cursor-pointer text-left transition-all duration-150 ease-in-out hover:-translate-y-[2px]",
              "hover:border-[var(--ds-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            )}
            style={cardStyle}
          >
            <KpiCardBody card={card} />
          </button>
        );
      })}
    </section>
  );
}
