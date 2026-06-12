// src/app/auth/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, Github, Mail } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const handleOAuth = async (provider: string) => {
    setOauthLoading(provider);
    await signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Form */}
      <div className="flex flex-col justify-center w-full max-w-md mx-auto px-8 py-12 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold font-display text-foreground">PixVault</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Sign in to access your events and media
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* OAuth buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={() => handleOAuth("google")}
            disabled={!!oauthLoading}
            className={cn(
              "flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl border border-border",
              "bg-background text-foreground text-sm font-medium",
              "hover:bg-secondary transition-colors duration-200",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {oauthLoading === "google" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth("github")}
            disabled={!!oauthLoading}
            className={cn(
              "flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl border border-border",
              "bg-background text-foreground text-sm font-medium",
              "hover:bg-secondary transition-colors duration-200",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {oauthLoading === "github" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Github className="w-4 h-4" />
            )}
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-muted-foreground">or continue with email</span>
          </div>
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="arjun@college.ac.in"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border bg-background text-foreground text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring transition-shadow",
                errors.email ? "border-destructive" : "border-border"
              )}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border bg-background text-foreground text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring transition-shadow",
                errors.password ? "border-destructive" : "border-border"
              )}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl",
              "bg-primary text-primary-foreground text-sm font-semibold",
              "hover:bg-primary/90 transition-colors duration-200",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>

      {/* Right: Decorative panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-600 to-brand-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 gap-6 text-white">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-2">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold font-display leading-tight">
            Your memories,<br />perfectly organized
          </h2>
          <p className="text-white/70 text-base max-w-sm">
            Upload, tag, and share event photos with your entire club. AI-powered tagging finds every face automatically.
          </p>
          <div className="flex gap-4 mt-4">
            {["📸 AI Tagging", "👤 Face Recognition", "📱 Mobile Ready"].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium text-white/90">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
