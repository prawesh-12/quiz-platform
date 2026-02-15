import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { sessionService } from "@/services/sessionService";
import { QUIZ_SESSION_PAYLOAD_KEY, QUIZ_SESSION_TOKEN_KEY } from "@/utils/sessionKeys";

const entrySchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  roll_no: z.string().trim().min(1, "Roll number is required"),
  email: z.string().trim().email("Enter a valid email"),
  division: z.string().trim().min(1, "Division is required"),
  group_no: z.string().trim().min(1, "Group is required"),
  access_code: z.string().trim().max(20).optional()
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
        quiz: data.quiz,
        questions: data.questions
      };

      sessionStorage.setItem(QUIZ_SESSION_TOKEN_KEY, data.session_token);
      sessionStorage.setItem(QUIZ_SESSION_PAYLOAD_KEY, JSON.stringify(payload));

      navigate("/quiz/take", {
        replace: true,
        state: payload
      });
    } catch (error) {
      setServerError(error?.response?.data?.error || "Unable to start quiz. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Quiz Entry</CardTitle>
          <CardDescription>Fill in your details to begin the quiz.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roll_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter roll number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="student@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="division"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 7" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="group_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. G13" {...field} />
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
                  <FormItem>
                    <FormLabel>Access Code (if provided)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter access code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError ? <p className="text-sm font-medium text-destructive">{serverError}</p> : null}

              <Button className="w-full" type="submit" disabled={form.formState.isSubmitting || enterMutation.isPending}>
                {form.formState.isSubmitting || enterMutation.isPending ? "Starting quiz..." : "Start Quiz"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          By starting this quiz, your session is monitored for proctoring and saved automatically.
        </CardFooter>
      </Card>
    </div>
  );
}
