import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authService } from "@/services/authService";
import { theme } from "@/theme";

import AuthShell, { FOCUS_RING } from "./auth-shell";

const MIN_PASSWORD_LENGTH = 8;

// 44px controls with 16px text: comfortable to tap and no iOS focus zoom.
const FIELD_CLASS = "h-11 text-base";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
});

function RegisterFooter() {
  return (
    <p className="text-center text-[12px]" style={{ color: theme.text.muted }}>
      Already have an account?{" "}
      <Link
        to="/login"
        className={`font-semibold underline-offset-4 hover:underline ${FOCUS_RING}`}
        style={{ color: theme.accent.DEFAULT, outlineColor: theme.accent.DEFAULT }}
      >
        Sign in
      </Link>
    </p>
  );
}

export default function RegisterPage() {
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" }
  });

  const onSubmit = async (values) => {
    setServerError("");

    try {
      await authService.register(values);
      navigate("/login", { replace: true });
    } catch (error) {
      setServerError(error?.response?.data?.error || "Registration failed. Please try again.");
    }
  };

  return (
    <AuthShell backTo="/login" backLabel="Sign in" footer={<RegisterFooter />}>
      <h1 className="text-[24px] font-bold tracking-[-0.02em]" style={{ color: theme.text.primary }}>
        Create a teacher account
      </h1>
      <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: theme.text.secondary }}>
        One account runs your question bank, your quizzes and your live monitor.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input className={FIELD_CLASS} type="text" placeholder="Your full name" autoComplete="name" {...field} />
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
                  <Input className={FIELD_CLASS} type="email" placeholder="teacher@example.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    className={FIELD_CLASS}
                    placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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

          <Button className="h-11 w-full rounded-full text-[15px]" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
