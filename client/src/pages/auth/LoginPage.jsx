import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/authService";
import { theme } from "@/theme";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [mode, setMode] = useState("teacher");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    const prefetchTeacherAssets = () => {
      Promise.all([
        import("@/pages/teacher/DashboardPage"),
        import("@/components/teacher/ParticipantsTrendChart")
      ]).catch(() => {
        // Ignore prefetch failures; normal route loading still works.
      });
    };

    let idleId = null;
    let timeoutId = null;

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(prefetchTeacherAssets, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(prefetchTeacherAssets, 600);
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

  const onSubmit = async (values) => {
    setServerError("");

    try {
      import("@/pages/teacher/DashboardPage").catch(() => {});
      const data = await authService.login({
        ...values,
        role: mode
      });
      const userRole = data?.user?.role;

      if (userRole !== mode) {
        toast({
          title: "Access denied",
          description: `This account does not have ${mode} access.`,
          variant: "destructive"
        });
        return;
      }

      login({ token: data.token, user: data.user });
      if (mode === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/teacher", { replace: true });
      }
    } catch (error) {
      const message = error?.response?.data?.error || "Login failed. Please try again.";
      setServerError(message);
    }
  };

  return (
    <div className="ds-shell-page">
      <Card
        className="w-full max-w-md"
        style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}
      >
        <CardHeader>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("teacher")}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                mode === "teacher"
                  ? "border-2 border-black font-bold text-black"
                  : "border border-gray-300 text-gray-500"
              }`}
            >
              Teacher Login
            </button>
            <button
              type="button"
              onClick={() => setMode("admin")}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                mode === "admin"
                  ? "border-2 border-black font-bold text-black"
                  : "border border-gray-300 text-gray-500"
              }`}
            >
              Admin Login
            </button>
          </div>
          <CardTitle style={{ color: theme.text.primary }}>
            {mode === "admin" ? "Admin Login" : "Teacher Login"}
          </CardTitle>
          <CardDescription>
            {mode === "admin"
              ? "Sign in to access the admin dashboard."
              : "Sign in to access the teacher dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="teacher@example.com" autoComplete="email" {...field} />
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
                      <PasswordInput placeholder="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError ? <p className="text-sm font-medium text-destructive">{serverError}</p> : null}

              <Button
                className="w-full"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Signing in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
