import { Button } from "@/components/ui/button";
import QuizPreviewDialog from "@/components/teacher/QuizPreviewDialog";
import ShareQuizDialog from "@/components/teacher/ShareQuizDialog";

export function ManualQuizToolbar({ isSaving, onSaveDraft, onPreview, onActivate }) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
      <Button
        type="button"
        variant="outline"
        className="flex-1 sm:flex-none"
        onClick={onSaveDraft}
        disabled={isSaving}
      >
        Save as Draft
      </Button>
      <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={onPreview}>
        Preview
      </Button>
      <Button type="button" className="flex-1 sm:flex-none" onClick={onActivate} disabled={isSaving}>
        Schedule Quiz
      </Button>
    </div>
  );
}

export function ManualQuizDialogs({ share, preview }) {
  return (
    <>
      <ShareQuizDialog
        open={share.isOpen}
        onOpenChange={share.onOpenChange}
        shareUrl={share.url}
        onCopy={share.copy}
      />

      <QuizPreviewDialog
        open={preview.isOpen}
        onOpenChange={preview.setIsOpen}
        title={preview.title}
        durationMins={preview.durationMins}
        questions={preview.questions}
        isLoading={preview.isLoading}
        isError={preview.isError}
        errorMessage={preview.errorMessage}
      />
    </>
  );
}
