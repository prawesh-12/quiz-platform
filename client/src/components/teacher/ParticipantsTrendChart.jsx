import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { theme } from "@/theme";

const AXIS_FONT_SIZE = 11;
const AREA_FILL_ID = "participantsAreaFill";
const FILL_OPACITY_TOP = 0.18;
const ACTIVE_DOT_RADIUS = 4;

export default function ParticipantsTrendChart({ trendData }) {
  return (
    <div className="h-full min-h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
        <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={AREA_FILL_ID} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.accent.DEFAULT} stopOpacity={FILL_OPACITY_TOP} />
              <stop offset="95%" stopColor={theme.accent.DEFAULT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={theme.border.light} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: theme.text.subtle, fontSize: AXIS_FONT_SIZE }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: theme.text.subtle, fontSize: AXIS_FONT_SIZE }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ stroke: theme.accent.DEFAULT, strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.border.default}`,
              backgroundColor: theme.bg.card,
              boxShadow: theme.shadow.tooltip,
              padding: "10px 12px",
            }}
            formatter={(value) => [
              <span key="participants-value" style={{ color: theme.text.primary, fontWeight: theme.font.weight.bold }}>
                {value}
              </span>,
              "Participants",
            ]}
            labelFormatter={(label) => (
              <span style={{ color: theme.text.primary, fontWeight: theme.font.weight.semibold }}>
                {`Date: ${label}`}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={theme.accent.DEFAULT}
            strokeWidth={2}
            fill={`url(#${AREA_FILL_ID})`}
            activeDot={{
              r: ACTIVE_DOT_RADIUS,
              fill: theme.accent.DEFAULT,
              stroke: theme.text.white,
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
