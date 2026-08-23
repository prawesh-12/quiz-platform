import { quizService } from "@/services/quizService";

export async function exportQuizResults(quizId, toast) {
  try {
    const { blob, filename } = await quizService.exportResults(quizId);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || `quiz_${quizId}_results.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast({ title: "Export ready", description: "Results download started." });
  } catch (error) {
    toast({
      title: "Export failed",
      description: error?.response?.data?.error || "Could not export results.",
      variant: "destructive",
    });
  }
}
