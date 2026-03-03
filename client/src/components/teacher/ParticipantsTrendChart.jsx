import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ParticipantsTrendChart({ trendData, theme }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="participantsAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B9EBF" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3B9EBF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={theme.border.light} strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: theme.text.subtle, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: theme.text.subtle, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{
            stroke: "#3B9EBF",
            strokeWidth: 1,
            strokeDasharray: "3 3"
          }}
          contentStyle={{
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.border.default}`,
            boxShadow: theme.shadow.tooltip,
            padding: "10px 12px"
          }}
          formatter={(value) => [
            <span key="participants-value" style={{ color: theme.text.primary, fontWeight: theme.font.weight.bold }}>
              {value}
            </span>,
            "Participants"
          ]}
          labelFormatter={(label) => (
            <span style={{ color: theme.text.primary, fontWeight: theme.font.weight.semibold }}>{`Date: ${label}`}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3B9EBF"
          strokeWidth={2}
          fill="url(#participantsAreaFill)"
          activeDot={{
            r: 4,
            fill: "#3B9EBF",
            stroke: theme.text.white,
            strokeWidth: 2
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
