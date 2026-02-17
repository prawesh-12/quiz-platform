import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import QuestionBuilder from "@/components/teacher/QuestionBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function QuestionPreviewList({
  questions,
  units,
  onUpdateQuestion,
  onRemoveQuestion,
  onClearAll
}) {
  if (!questions.length) {
    return null;
  }

  return (
    <div className="space-y-6 rounded-lg border border-dashed p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Imported Questions Preview ({questions.length})</h3>
        <Button variant="destructive" size="sm" onClick={onClearAll}>
          Clear All Imported
        </Button>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="relative space-y-4 rounded-lg border bg-muted/30 p-4">
             <div className="absolute right-4 top-4 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => onRemoveQuestion(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
             </div>

            <QuestionBuilder
              question={question}
              index={index} // Note: This index is relative to imported list
              onChange={(updated) => onUpdateQuestion(question.id, updated)}
              canRemove={false} // We handle remove externally
            />

            <div className="grid grid-cols-1 gap-4 rounded-md border bg-background p-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2">
                <Switch
                  id={`bank-${question.id}`}
                  checked={question.in_subject_bank}
                  onCheckedChange={(checked) =>
                    onUpdateQuestion(question.id, { ...question, in_subject_bank: checked })
                  }
                />
                <Label htmlFor={`bank-${question.id}`}>Add to Question Bank</Label>
              </div>

              {question.in_subject_bank ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Select Unit</Label>
                    <Select
                      value={question.unit_id ? String(question.unit_id) : "new"}
                      onValueChange={(value) => {
                        if (value === "new") {
                          onUpdateQuestion(question.id, { ...question, unit_id: null, new_unit_name: "" });
                        } else {
                          onUpdateQuestion(question.id, {
                            ...question,
                            unit_id: Number(value),
                            new_unit_name: null
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">+ Create New Unit</SelectItem>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={String(unit.id)}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!question.unit_id ? (
                    <div className="space-y-2">
                      <Label className="text-xs">New Unit Name</Label>
                      <Input
                        value={question.new_unit_name || ""}
                        onChange={(e) =>
                          onUpdateQuestion(question.id, { ...question, new_unit_name: e.target.value })
                        }
                        placeholder="e.g. Thermodynamics"
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
