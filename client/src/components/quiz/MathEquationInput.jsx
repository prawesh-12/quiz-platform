import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

const TOKENS = ["x", "y", "\\frac{}{}", "\\sqrt{}", "\\pi", "\\Sigma", "\\int", "\\leq", "\\geq", "\\neq"];

export default function MathEquationInput({ value, onConfirm, triggerLabel = "Enter an equation" }) {
  const [draft, setDraft] = useState(value || "");
  const [latexMode, setLatexMode] = useState(true);

  return (
    <Popover>
      <div className="relative inline-block">
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            {triggerLabel}
          </Button>
        </PopoverTrigger>

        <PopoverContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Switch to LaTeX</Label>
              <Switch checked={latexMode} onCheckedChange={setLatexMode} />
            </div>

            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type equation"
            />

            <div className="grid grid-cols-2 gap-2">
              {TOKENS.map((token) => (
                <Button
                  key={token}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setDraft((prev) => `${prev}${latexMode ? token : token.replace(/\\/g, "")}`)}
                >
                  {token}
                </Button>
              ))}
            </div>

            <Button type="button" className="w-full" onClick={() => onConfirm?.(draft)}>
              OK
            </Button>
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
}
