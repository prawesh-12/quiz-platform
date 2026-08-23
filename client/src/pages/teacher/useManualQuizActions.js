import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useToast } from "@/hooks/useToast";
import { quizService } from "@/services/quizService";
import {
  buildShareUrlFromToken,
  extractApiError,
  hasInvalidScheduleRange
} from "@/pages/teacher/manualQuizHelpers";
import { mapBuilderQuestionToApi } from "@/pages/teacher/quizQuestionMappers";

function findQuestionListError(allQuestions) {
  if (!allQuestions.length) {
    return "Add at least one question";
  }

  for (let index = 0; index < allQuestions.length; index += 1) {
    const item = allQuestions[index];
    const options = Object.fromEntries(item.options.map((option) => [option.key, option.value.trim()]));

    if (!item.question_text.trim()) {
      return `Question ${index + 1}: question text is required`;
    }

    if (!options.a || !options.b) {
      return `Question ${index + 1}: option A and B are required`;
    }

    if (!item.options.some((option) => option.key === item.correct_option && option.value.trim())) {
      return `Question ${index + 1}: valid correct option is required`;
    }
  }

  return null;
}

function toPersistedQuestionIds(questions) {
  return questions.map((item) => Number(item.id)).filter((item) => Number.isInteger(item) && item > 0);
}

function findBlockingError(form) {
  if (!form.values.subjectId) {
    return "Select a subject";
  }

  if (hasInvalidScheduleRange(form.values.scheduledStart, form.values.scheduledEnd)) {
    return "Scheduled end must be later than scheduled start";
  }

  return null;
}

function findActivationError(form) {
  if (!form.values.accessCode.trim()) {
    return "Access code is required to activate quiz";
  }

  if (!form.values.scheduledStart) {
    return "Scheduled start is required to schedule the quiz";
  }

  return findBlockingError(form);
}

// New quizzes carry their questions in the payload; saved ones are updated by question id.
function findSubmitError(ctx, findFormError) {
  const formError = findFormError(ctx.form);
  if (formError || ctx.isExistingQuiz) {
    return formError;
  }

  return findQuestionListError([...ctx.questions, ...ctx.importedQuestions]);
}

function buildFullPayload(ctx) {
  return {
    ...ctx.form.buildPayload(),
    questions: [...ctx.questions, ...ctx.importedQuestions].map(mapBuilderQuestionToApi)
  };
}

function finishDraft(ctx) {
  ctx.queryClient.invalidateQueries({ queryKey: ["quizzes"] });
  ctx.toast({ title: "Saved as draft", description: "Quiz has been saved as draft." });
  ctx.navigate("/teacher", { replace: true });
}

async function saveExistingDraft(ctx) {
  const questionIds = toPersistedQuestionIds(ctx.questions);
  await ctx.updateQuiz.mutateAsync({
    id: ctx.quizId,
    payload: {
      ...ctx.form.buildPayload(),
      status: "draft",
      ...(questionIds.length ? { question_ids: questionIds } : {})
    }
  });
  finishDraft(ctx);
}

async function saveDraft(ctx) {
  ctx.setPageError("");

  const blockingError = findSubmitError(ctx, findBlockingError);
  if (blockingError) {
    ctx.setPageError(blockingError);
    return;
  }

  try {
    if (ctx.isExistingQuiz) {
      await saveExistingDraft(ctx);
      return;
    }

    await ctx.saveManual.mutateAsync(buildFullPayload(ctx));
    finishDraft(ctx);
  } catch (error) {
    ctx.setPageError(extractApiError(error, "Failed to save quiz"));
  }
}

function announceActivation(ctx, activatedQuiz, activeQuizId, fallbackStart) {
  const isScheduled = activatedQuiz?.status === "scheduled";
  const shareUrl = buildShareUrlFromToken(activatedQuiz?.access_token);
  const path = isScheduled ? "/teacher/quiz/scheduled" : `/teacher/quiz/ongoing/${activeQuizId}`;
  const navigation = { path, replace: !ctx.isExistingQuiz };

  if (shareUrl) {
    ctx.share.openFor(shareUrl, navigation);
  } else {
    ctx.navigate(navigation.path, { replace: navigation.replace });
  }

  const startValue = activatedQuiz?.scheduled_start || fallbackStart;
  ctx.toast({
    title: isScheduled ? "Quiz Scheduled" : "Quiz Activated",
    description: isScheduled
      ? `Quiz scheduled for ${new Date(startValue).toLocaleString()}`
      : "Quiz is now live."
  });
}

async function runActivation(ctx, activeQuizId) {
  const questionIds = toPersistedQuestionIds(ctx.questions);
  const payload = {
    ...ctx.form.buildPayload(),
    status: "active",
    ...(ctx.isExistingQuiz && questionIds.length ? { question_ids: questionIds } : {})
  };

  const response = await ctx.updateQuiz.mutateAsync({ id: activeQuizId, payload });

  ctx.queryClient.invalidateQueries({ queryKey: ["quizzes"] });
  ctx.queryClient.invalidateQueries({ queryKey: ["quizzes", activeQuizId] });
  ctx.queryClient.invalidateQueries({ queryKey: ["quizzes", "scheduled"] });
  announceActivation(ctx, response?.quiz, activeQuizId, payload.scheduled_start);
}

async function activateQuiz(ctx) {
  ctx.setPageError("");

  const blockingError = findSubmitError(ctx, findActivationError);
  if (blockingError) {
    ctx.setPageError(blockingError);
    return;
  }

  try {
    let activeQuizId = ctx.quizId;
    if (!ctx.isExistingQuiz) {
      const response = await ctx.saveManual.mutateAsync(buildFullPayload(ctx));
      activeQuizId = response.quiz.id;
    }

    await runActivation(ctx, activeQuizId);
  } catch (error) {
    ctx.setPageError(extractApiError(error, "Failed to activate quiz"));
  }
}

function useShareDialog(persistedShareUrl) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const onOpenChange = (open) => {
    setIsOpen(open);

    if (!open && pendingNavigation) {
      navigate(pendingNavigation.path, { replace: pendingNavigation.replace });
      setPendingNavigation(null);
      setUrl("");
    }
  };

  const copy = async () => {
    const value = url || persistedShareUrl;
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    toast({ title: "Link copied", description: "Quiz link copied to clipboard." });
  };

  const openFor = (nextUrl, navigation) => {
    setUrl(nextUrl);
    setPendingNavigation(navigation);
    setIsOpen(true);
  };

  return { isOpen, url: url || persistedShareUrl, onOpenChange, copy, openFor };
}

// Owns save, activation and sharing so the page keeps only its form and question list.
export function useManualQuizActions(options) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const share = useShareDialog(options.persistedShareUrl);

  const saveManual = useMutation({ mutationFn: (payload) => quizService.createManual(payload) });
  const updateQuiz = useMutation({ mutationFn: ({ id, payload }) => quizService.update(id, payload) });

  const ctx = { ...options, navigate, queryClient, toast, share, saveManual, updateQuiz };

  return {
    saveAsDraft: () => saveDraft(ctx),
    activateQuiz: () => activateQuiz(ctx),
    share,
    isSaving: saveManual.isPending || updateQuiz.isPending
  };
}
