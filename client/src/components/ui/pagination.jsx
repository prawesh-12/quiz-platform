import { Button } from "@/components/ui/button";

export default function Pagination({ page, totalPages, onPageChange }) {
  const safePage = Math.max(1, page || 1);
  const safeTotalPages = Math.max(1, totalPages || 1);

  return (
    <div className="flex items-center justify-end gap-2">
      <Button type="button" variant="outline" size="sm" disabled={safePage <= 1} onClick={() => onPageChange?.(safePage - 1)}>
        Previous
      </Button>
      <p className="text-xs text-muted-foreground">
        Page {safePage} of {safeTotalPages}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={safePage >= safeTotalPages}
        onClick={() => onPageChange?.(safePage + 1)}
      >
        Next
      </Button>
    </div>
  );
}
