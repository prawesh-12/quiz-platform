import { useEffect, useMemo, useState } from "react";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function splitDateTime(value) {
  if (!value) {
    return { date: "", time: "" };
  }

  const [datePart, timePart = ""] = String(value).split("T");
  return {
    date: datePart || "",
    time: timePart.slice(0, 5)
  };
}

function combineDateTime(date, time) {
  if (!date) {
    return "";
  }

  return `${date}T${(time || "00:00").slice(0, 5)}`;
}

export default function DateTimePicker({ value, onChange, placeholder = "Select date and time" }) {
  const [open, setOpen] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");

  useEffect(() => {
    const next = splitDateTime(value);
    setDateValue(next.date);
    setTimeValue(next.time);
  }, [value]);

  const formatted = useMemo(() => {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return parsed.toLocaleString();
  }, [value]);

  const applyDate = (nextDate) => {
    setDateValue(nextDate);
    onChange?.(combineDateTime(nextDate, timeValue));
  };

  const applyTime = (nextTime) => {
    setTimeValue(nextTime);
    onChange?.(combineDateTime(dateValue, nextTime));
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-start">
            <CalendarDays className="mr-2 h-4 w-4" />
            {formatted || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 space-y-3 p-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Date</p>
            <Input type="date" value={dateValue} onChange={(event) => applyDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Time</p>
            <Input type="time" value={timeValue} onChange={(event) => applyTime(event.target.value)} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateValue("");
                setTimeValue("");
                onChange?.("");
              }}
            >
              Clear
            </Button>
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
