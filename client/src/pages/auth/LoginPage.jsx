import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (values) => {
    setServerError("");

    try {
      const data = await authService.login(values);
      login({ token: data.token, user: data.user });
      navigate("/teacher", { replace: true });
    } catch (error) {
      const message = error?.response?.data?.error || "Login failed. Please try again.";
      setServerError(message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Teacher Login</CardTitle>
          <CardDescription>Sign in to access the teacher dashboard.</CardDescription>
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
                      <Input type="password" placeholder="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError ? <p className="text-sm font-medium text-destructive">{serverError}</p> : null}

              <Button
                className="w-full bg-gradient-to-r from-[#2647d6] to-[#4562ea] text-white shadow-[0_12px_22px_rgba(52,87,230,0.32)] transition-colors hover:from-[#3050da] hover:to-[#4f6cf0] focus-visible:ring-2 focus-visible:ring-[#6f8eff] focus-visible:ring-offset-2"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Signing in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          New teacher?&nbsp;
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/register">
            Create account
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
