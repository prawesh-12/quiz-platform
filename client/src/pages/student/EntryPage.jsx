import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { sessionService } from "@/services/sessionService";
import { theme } from "@/theme";
import {
  QUIZ_SESSION_ANSWERS_KEY,
  QUIZ_SESSION_DIRTY_KEY,
  QUIZ_SESSION_PAYLOAD_KEY,
  QUIZ_SESSION_TOKEN_KEY
} from "@/utils/sessionKeys";

const MAX_ACCESS_CODE_LENGTH = 20;
const CARD_RADIUS_PX = "20px";
// 16px input text keeps iOS from zooming the page when a student taps a field.
const FIELD_CLASS = "h-11 w-full text-base";
const PAGE_WASH = `linear-gradient(180deg, ${theme.accent.tint} 0%, ${theme.bg.page} 48%, ${theme.bg.app} 100%)`;

const entrySchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  roll_no: z.string().trim().min(1, "Roll number is required"),
  email: z.string().trim().email("Enter a valid email"),
  division: z.string().trim().min(1, "Division is required"),
  group_no: z.string().trim().min(1, "Group is required"),
  access_code: z.string().trim().min(1, "Access code is required").max(MAX_ACCESS_CODE_LENGTH)
});

function EntryField({ control, name, label, ...inputProps }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className="text-[13px] font-semibold">{label}</FormLabel>
          <FormControl>
            <Input className={FIELD_CLASS} {...inputProps} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function buildSessionPayload(accessToken, data) {
  return {
    accessToken,
    sessionToken: data.session_token,
    durationSeconds: Number(data.duration_secs || 0),
    totalDurationSeconds: Number(data.total_duration_secs || 0),
    countdownToStartSeconds: Number(data.countdown_to_start_secs || 0),
    serverNow: data.server_now || null,
    startTime: data.start_time || null,
    endTime: data.end_time || null,
    quizState: data.quiz_state || "active",
    quiz: data.quiz,
    questions: data.questions
  };
}

function storeSession(payload) {
  sessionStorage.setItem(QUIZ_SESSION_TOKEN_KEY, payload.sessionToken);
  sessionStorage.setItem(QUIZ_SESSION_PAYLOAD_KEY, JSON.stringify(payload));
  // Drop any stale answers from a previous/abandoned session before this one starts.
  sessionStorage.removeItem(QUIZ_SESSION_ANSWERS_KEY);
  sessionStorage.removeItem(QUIZ_SESSION_DIRTY_KEY);
}

export default function EntryPage() {
  const navigate = useNavigate();
  const { accessToken } = useParams();
  const [serverError, setServerError] = useState("");

  const form = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      name: "",
      roll_no: "",
      email: "",
      division: "",
      group_no: "",
      access_code: ""
    }
  });

  const enterMutation = useMutation({
    mutationFn: (values) => sessionService.enter(values)
  });

  const onSubmit = async (values) => {
    setServerError("");

    try {
      const data = await enterMutation.mutateAsync({ access_token: accessToken, ...values });
      const payload = buildSessionPayload(accessToken, data);

      storeSession(payload);
      navigate("/quiz/take", { replace: true, state: payload });
    } catch (error) {
      setServerError(error?.response?.data?.error || "Unable to start quiz. Please try again.");
    }
  };

  const isStarting = form.formState.isSubmitting || enterMutation.isPending;

  return (
    <div
      className="ds-viewport-h w-full overflow-y-auto px-4 py-8"
      style={{ background: PAGE_WASH, fontFamily: theme.font.family }}
    >
      <div
        className="mx-auto w-full max-w-md border p-5 sm:p-6"
        style={{
          borderRadius: CARD_RADIUS_PX,
          borderColor: theme.border.default,
          backgroundColor: theme.bg.card,
          boxShadow: theme.shadow.card
        }}
      >
        <h1 className="text-[24px] font-bold tracking-[-0.02em]" style={{ color: theme.text.primary }}>
          Quiz entry
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: theme.text.secondary }}>
          Fill in your details, then enter the access code your teacher read out.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-3.5">
            <EntryField
              control={form.control}
              name="name"
              label="Name"
              placeholder="Enter your full name"
              autoComplete="name"
            />
            <EntryField
              control={form.control}
              name="roll_no"
              label="Roll number"
              placeholder="Enter roll number"
              inputMode="numeric"
            />
            <EntryField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="student@example.com"
              autoComplete="email"
            />

            <div className="grid grid-cols-2 gap-3">
              <EntryField control={form.control} name="division" label="Division" placeholder="e.g. 7" />
              <EntryField control={form.control} name="group_no" label="Group" placeholder="e.g. G13" />
            </div>

            <EntryField
              control={form.control}
              name="access_code"
              label="Access code"
              placeholder="Enter access code"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={MAX_ACCESS_CODE_LENGTH}
            />

            {serverError ? (
              <p
                role="alert"
                className="rounded-[10px] px-3 py-2 text-[13px] font-medium"
                style={{ backgroundColor: theme.status.flaggedTint, color: theme.status.flagged }}
              >
                {serverError}
              </p>
            ) : null}

            <Button className="mt-1 h-12 w-full rounded-full text-[15px]" type="submit" disabled={isStarting}>
              {isStarting ? "Starting quiz..." : "Start quiz"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
