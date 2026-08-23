import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/authService";
import { theme } from "@/theme";

import AuthShell, { FOCUS_RING } from "./auth-shell";
import { DemoLogins, RoleToggle } from "./login-parts";

const IDLE_PREFETCH_TIMEOUT_MS = 1500;
const FALLBACK_PREFETCH_DELAY_MS = 600;

// 44px controls with 16px text: comfortable to tap and no iOS focus zoom.
const FIELD_CLASS = "h-11 text-base";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

function prefetchTeacherAssets() {
  Promise.all([
    import("@/pages/teacher/DashboardPage"),
    import("@/components/teacher/ParticipantsTrendChart")
  ]).catch(() => {});
}

// Warm the teacher bundle while the login form is idle so the first dashboard paint is instant.
function useTeacherPrefetch() {
  useEffect(() => {
    let idleId = null;
    let timeoutId = null;

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(prefetchTeacherAssets, { timeout: IDLE_PREFETCH_TIMEOUT_MS });
    } else {
      timeoutId = window.setTimeout(prefetchTeacherAssets, FALLBACK_PREFETCH_DELAY_MS);
    }

    return () => {
      if (idleId != null) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);
}

function LoginFooter() {
  return (
    <p className="text-center text-[12px]" style={{ color: theme.text.muted }}>
      New teacher?{" "}
      <Link
        to="/register"
        className={`font-semibold underline-offset-4 hover:underline ${FOCUS_RING}`}
        style={{ color: theme.accent.DEFAULT, outlineColor: theme.accent.DEFAULT }}
      >
        Create an account
      </Link>
    </p>
  );
}

export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [mode, setMode] = useState("teacher");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  useTeacherPrefetch();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const fillDemo = (cred) => {
    setMode(cred.role);
    form.setValue("email", cred.email, { shouldValidate: true });
    form.setValue("password", cred.password, { shouldValidate: true });
    setServerError("");
  };

  const routeAfterLogin = (userRole) => {
    if (userRole === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    navigate("/teacher", { replace: true });
  };

  const onSubmit = async (values) => {
    setServerError("");

    try {
      const data = await authService.login({ ...values, role: mode });
      const userRole = data?.user?.role;

      if (userRole !== mode) {
        toast({
          title: "Access denied",
          description: `This account does not have ${mode} access.`,
          variant: "destructive"
        });
        return;
      }

      login({ user: data.user });
      routeAfterLogin(mode);
    } catch (error) {
      setServerError(error?.response?.data?.error || "Login failed. Please try again.");
    }
  };

  const isAdminMode = mode === "admin";

  return (
    <AuthShell backTo="/" backLabel="Home" footer={<LoginFooter />}>
      <RoleToggle mode={mode} onChange={setMode} />

      <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em]" style={{ color: theme.text.primary }}>
        {isAdminMode ? "Admin sign in" : "Teacher sign in"}
      </h1>
      <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: theme.text.secondary }}>
        {isAdminMode
          ? "Manage schools, teachers and subjects from one place."
          : "Build question banks, schedule quizzes and watch the room work."}
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-4">
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
                  <PasswordInput className={FIELD_CLASS} placeholder="Your password" autoComplete="current-password" {...field} />
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
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="mt-6">
        <DemoLogins onPick={fillDemo} />
      </div>
    </AuthShell>
  );
}
