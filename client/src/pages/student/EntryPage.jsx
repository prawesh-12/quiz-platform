import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const entrySchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  roll_no: z.string().trim().min(1, "Roll number is required"),
  email: z.string().trim().email("Enter a valid email"),
  division: z.string().trim().min(1, "Division is required"),
  group_no: z.string().trim().min(1, "Group is required"),
  access_code: z.string().trim().min(1, "Access code is required").max(20)
});

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
    mutationFn: (payload) => sessionService.enter(payload)
  });

  const onSubmit = async (values) => {
    setServerError("");

    try {
      const data = await enterMutation.mutateAsync({
        access_token: accessToken,
        ...values
      });

      const payload = {
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

      sessionStorage.setItem(QUIZ_SESSION_TOKEN_KEY, data.session_token);
      sessionStorage.setItem(QUIZ_SESSION_PAYLOAD_KEY, JSON.stringify(payload));
      // Drop any stale answers from a previous/abandoned session before this one starts.
      sessionStorage.removeItem(QUIZ_SESSION_ANSWERS_KEY);
      sessionStorage.removeItem(QUIZ_SESSION_DIRTY_KEY);

      navigate("/quiz/take", {
        replace: true,
        state: payload
      });
    } catch (error) {
      setServerError(error?.response?.data?.error || "Unable to start quiz. Please try again.");
    }
  };

  return (
    <div className="ds-shell-page">
      <Card
        className="mx-4 w-full max-w-sm p-4"
        style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}
      >
        <CardHeader className="p-0 mb-3">
          <CardTitle style={{ color: theme.text.primary }}>Quiz Entry</CardTitle>
          <CardDescription>Fill in your details to begin the quiz.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">Name</FormLabel>
                    <FormControl>
                      <Input className="h-9 w-full" placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roll_no"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">Roll Number</FormLabel>
                    <FormControl>
                      <Input className="h-9 w-full" placeholder="Enter roll number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input className="h-9 w-full" type="email" placeholder="student@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="division"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">Division</FormLabel>
                      <FormControl>
                        <Input className="h-9 w-full" placeholder="e.g. 7" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="group_no"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">Group</FormLabel>
                      <FormControl>
                        <Input className="h-9 w-full" placeholder="e.g. G13" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="access_code"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">Access Code</FormLabel>
                    <FormControl>
                      <Input className="h-9 w-full" placeholder="Enter access code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError ? (
                <p className="mt-1 text-sm" style={{ color: theme.text.accent }}>
                  {serverError}
                </p>
              ) : null}

              <Button className="mt-2 h-10 w-full" type="submit" disabled={form.formState.isSubmitting || enterMutation.isPending}>
                {form.formState.isSubmitting || enterMutation.isPending ? "Starting quiz..." : "Start Quiz"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
