import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatTime } from "@/utils/formatTime";

export default function CountdownTimer({ secondsLeft, totalSeconds }) {
  const safeTotal = Math.max(1, Number(totalSeconds) || 1);
  const elapsedPercent = ((safeTotal - Math.max(0, secondsLeft)) / safeTotal) * 100;
  const isCritical = secondsLeft <= 30;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Time Remaining</p>
        <Badge variant={isCritical ? "destructive" : "secondary"}>{formatTime(secondsLeft)}</Badge>
      </div>
      <Progress value={elapsedPercent} />
    </div>
  );
}
