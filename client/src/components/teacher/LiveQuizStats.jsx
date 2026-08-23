import { Card, CardContent } from "@/components/ui/card";
import { theme } from "@/theme";

const TILES = [
  { key: "total_entered", label: "Total Students Entered", valueColor: theme.text.primary },
  { key: "submitted", label: "Submitted", valueColor: theme.status.active },
  { key: "pending", label: "Pending", valueColor: theme.status.pending },
  { key: "flagged", label: "Flagged", valueColor: theme.status.flagged },
];

export default function LiveQuizStats({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {TILES.map((tile) => (
        <Card
          key={tile.key}
          style={{
            borderRadius: theme.radius.lg,
            borderColor: theme.border.default,
            boxShadow: theme.shadow.card,
          }}
        >
          <CardContent className="px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: theme.text.muted }}>
              {tile.label}
            </p>
            <p className="mt-1 text-2xl font-semibold leading-none" style={{ color: tile.valueColor }}>
              {stats?.[tile.key] ?? 0}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
