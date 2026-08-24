import { lazy, Suspense } from "react";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";

import Spinner from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { theme } from "@/theme";

const ParticipantsTrendChart = lazy(() => import("@/components/teacher/ParticipantsTrendChart"));

const CONTROL_HEIGHT = "32px";
const CHART_HEIGHT = "260px";

function ButtonSpinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

function DateField({ id, label, value, onChange }) {
  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center sm:gap-2">
      <Label
        htmlFor={id}
        className="shrink-0 whitespace-nowrap text-[12px]"
        style={{ color: theme.text.muted, fontWeight: theme.font.weight.medium }}
      >
        {label}
      </Label>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-2 text-[12px] sm:w-[130px]"
        style={{
          height: CONTROL_HEIGHT,
          border: `1px solid ${theme.border.input}`,
          borderRadius: theme.radius.md,
        }}
      />
    </div>
  );
}

export default function DashboardTrendCard({
  startDateInput,
  endDateInput,
  onStartDateChange,
  onEndDateChange,
  onLoadTrend,
  isFetching,
  isLoading,
  isError,
  errorMessage,
  trendData,
}) {
  return (
    <article
      className="flex min-h-0 flex-1 flex-col overflow-hidden border p-4 sm:p-6"
      style={{
        borderRadius: theme.radius.xl,
        borderColor: theme.border.default,
        backgroundColor: theme.bg.card,
        boxShadow: theme.shadow.card,
      }}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <h2
          className="shrink-0 whitespace-nowrap text-[15px]"
          style={{ color: theme.text.primary, fontWeight: theme.font.weight.semibold }}
        >
          Unique Participants
        </h2>

        <div className="min-w-0 flex-1" />

        <div className="grid grid-cols-2 gap-2 sm:contents">
          <DateField id="trend-start-date" label="Start Date" value={startDateInput} onChange={onStartDateChange} />
          <DateField id="trend-end-date" label="End Date" value={endDateInput} onChange={onEndDateChange} />
        </div>

        <Button
          type="button"
          className="w-full shrink-0 justify-center whitespace-nowrap text-[13px] sm:w-auto"
          style={{
            height: CONTROL_HEIGHT,
            background: theme.bg.cta,
            color: theme.text.white,
            borderRadius: theme.radius.md,
            padding: "7px 14px",
            fontWeight: theme.font.weight.semibold,
          }}
          onClick={onLoadTrend}
          disabled={isFetching}
          aria-busy={isFetching}
        >
          {isFetching ? <ButtonSpinner /> : <TrendingUp className="h-3.5 w-3.5" />}
          {isFetching ? "Loading..." : "Load Data"}
        </Button>
      </div>

      {isLoading ? <Spinner className="py-2" label="Loading dashboard analytics..." /> : null}

      {isError ? (
        <p className="text-[12px]" style={{ color: theme.status.flagged }}>
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && !isError ? (
        <div
          className="w-full"
          style={{
            height: CHART_HEIGHT,
            minHeight: CHART_HEIGHT,
            opacity: isFetching ? 0.45 : 1,
            transition: "opacity 150ms ease",
          }}
        >
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <Spinner label="Loading chart..." />
              </div>
            }
          >
            <ParticipantsTrendChart trendData={trendData} />
          </Suspense>
        </div>
      ) : null}
    </article>
  );
}
