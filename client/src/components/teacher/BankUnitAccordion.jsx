import UnitSection, { UNCATEGORIZED_UNIT_ID } from "@/components/teacher/UnitSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { theme } from "@/theme";

function UnitRow({ unit, subjectId, onRename, onDelete }) {
  return (
    <AccordionItem value={String(unit.id)}>
      <div className="flex items-center gap-1 pr-4">
        <div className="min-w-0 flex-1">
          <AccordionTrigger className="px-4">
            <span className="min-w-0 break-words">
              {unit.name}
              <span className="ml-2 text-xs" style={{ color: theme.text.muted }}>
                ({unit.question_count} questions)
              </span>
            </span>
          </AccordionTrigger>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={() => onRename(unit)}>
          Rename
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(unit)}
        >
          Delete Unit
        </Button>
      </div>
      <AccordionContent>
        <UnitSection unitId={unit.id} subjectId={subjectId} />
      </AccordionContent>
    </AccordionItem>
  );
}

export default function BankUnitAccordion({ units, subjectId, onRenameUnit, onDeleteUnit }) {
  return (
    <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          {units.map((unit) => (
            <UnitRow
              key={unit.id}
              unit={unit}
              subjectId={subjectId}
              onRename={onRenameUnit}
              onDelete={onDeleteUnit}
            />
          ))}

          <AccordionItem value="uncategorized">
            <AccordionTrigger className="px-4">Uncategorized Questions</AccordionTrigger>
            <AccordionContent>
              <UnitSection unitId={UNCATEGORIZED_UNIT_ID} subjectId={subjectId} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
