import { lazy, Suspense } from "react";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";

import Spinner from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { theme } from "@/theme";

const ParticipantsTrendChart = lazy(() => import("@/components/teacher/ParticipantsTrendChart"));

const CHART_HEIGHT = "260px";

const CARD_STYLE = {
  borderRadius: theme.radius.lg,
  borderColor: theme.border.default,
  backgroundColor: theme.bg.card
};

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
    <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
      <Label
        htmlFor={id}
        className="shrink-0 whitespace-nowrap text-[12px] font-medium"
        style={{ color: theme.text.muted }}
      >
        {label}
      </Label>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full px-2 text-[12px] sm:w-[120px]"
      />
    </div>
  );
}

function TrendChart({ isLoading, isError, errorMessage, trendData, isFetching }) {
  if (isLoading) {
    return <Spinner className="py-2" label="Loading dashboard analytics..." />;
  }

  if (isError) {
    return (
      <p
        role="alert"
        className="rounded-[10px] px-3 py-2 text-[12px] font-medium"
        style={{ backgroundColor: theme.status.flaggedTint, color: theme.status.flagged }}
      >
        {errorMessage}
      </p>
    );
  }

  return (
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
        <ParticipantsTrendChart trendData={trendData} theme={theme} />
      </Suspense>
    </div>
  );
}

export default function AdminTrendCard({ range, trendData, isFetching, summary, onLoadTrend }) {
  return (
    <section className="mb-4 flex min-h-0 flex-1 gap-4">
      <article className="flex min-h-0 flex-1 flex-col overflow-hidden border p-4 sm:p-5" style={CARD_STYLE}>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <h2
            className="shrink-0 whitespace-nowrap text-[15px] font-semibold sm:mr-auto"
            style={{ color: theme.text.primary }}
          >
            Unique Participants
          </h2>

          <DateField
            id="trend-start-date-admin"
            label="Start Date"
            value={range.startInput}
            onChange={range.setStartInput}
          />
          <DateField
            id="trend-end-date-admin"
            label="End Date"
            value={range.endInput}
            onChange={range.setEndInput}
          />

          <Button
            type="button"
            className="h-8 w-full shrink-0 justify-center whitespace-nowrap text-[13px] sm:w-auto"
            onClick={onLoadTrend}
            disabled={isFetching}
            aria-busy={isFetching}
          >
            {isFetching ? <ButtonSpinner /> : <TrendingUp className="h-3.5 w-3.5" />}
            {isFetching ? "Loading..." : "Load Data"}
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <TrendChart
            isLoading={summary.isLoading}
            isError={summary.isError}
            errorMessage={summary.errorMessage}
            trendData={trendData}
            isFetching={isFetching}
          />
        </div>
      </article>
    </section>
  );
}
