"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { SpeeHiveMark, MicrosoftIcon } from "@/components/icons";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sun, 
  Moon, 
  ArrowRight,
  Sparkles,
  Check
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Redirect to dashboard if session already exists
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      if (data?.session) {
        router.push("/");
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      setError("Supabase URL is not configured. Check NEXT_PUBLIC_SUPABASE_URL.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });

        if (error) {
          setError(error.message);
        } else if (data?.session) {
          // If session is returned (email confirmation disabled), redirect to dashboard
          router.push("/");
          router.refresh();
        } else {
          // If email confirmation is enabled, notify user to verify
          setMessage("Account created! Check your email to verify and sign in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error — check your connection.");
    }

    setLoading(false);
  }

  async function handleMicrosoftSignIn() {
    setError("");
    setMessage("");
    setLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      setError("Supabase URL is not configured. Check NEXT_PUBLIC_SUPABASE_URL.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "openid profile email",
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error — check your connection.");
      setLoading(false);
    }
  }

  const resolvedTheme = mounted ? theme ?? "dark" : "dark";

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-300">
      {/* LEFT COLUMN: Premium Showcase Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-card/40 p-16 relative overflow-hidden border-r border-border">
        {/* Dynamic mesh gradients */}
        <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.01]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#3CBFAC]/10 rounded-full blur-3xl -ml-32 -mb-32 animate-pulse duration-[10000ms]" />

        {/* Branding header */}
        <div className="relative z-10 flex items-center gap-3">
          <SpeeHiveMark className="h-10 w-10 animate-bounce duration-[4000ms]" />
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            SpeeHive Control Centre
          </span>
        </div>

        {/* Feature/Integration showcase cards */}
        <div className="relative z-10 my-auto space-y-8 max-w-lg">
          <div>
            <span className="px-3 py-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full">
              Enterprise Integration Hub
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight mt-4 leading-tight">
              One unified cockpit for your work tools.
            </h2>
            <p className="text-muted-foreground mt-3 text-base leading-relaxed">
              SpeeHive harmonizes Microsoft 365 communications and Asana tasks, powered by local AI agents for instant executive digests.
            </p>
          </div>

          <div className="space-y-4">
            {/* Mock Integration Status Card 1 */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/80 shadow-md backdrop-blur-md hover:border-primary/20 hover:shadow-lg transition-all duration-300 group">
              <div className="p-3 rounded-lg bg-[#5B9FD4]/10 text-[#5B9FD4] group-hover:scale-110 transition-transform">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">Microsoft 365 Connection</p>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    Active Sync
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">Syncing Outlook inbox and Teams chats dynamically</p>
              </div>
            </div>

            {/* Mock Integration Status Card 2 */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/80 shadow-md backdrop-blur-md hover:border-primary/20 hover:shadow-lg transition-all duration-300 group">
              <div className="p-3 rounded-lg bg-[#60C83A]/10 text-[#60C83A] group-hover:scale-110 transition-transform">
                <Check className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">Asana Project Management</p>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    MCP Configured
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">Creating tasks and synchronizing board completions</p>
              </div>
            </div>

            {/* Mock Integration Status Card 3 */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/80 shadow-md backdrop-blur-md hover:border-primary/20 hover:shadow-lg transition-all duration-300 group">
              <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">AI Executive Briefing</p>
                  <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">Instant contextual insights across emails and projects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-muted-foreground flex justify-between">
          <span>&copy; {new Date().getFullYear()} SpeeHive. All rights reserved.</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy & Terms</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-16 relative">
        {/* Decorative corner glows for mobile */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="lg:hidden absolute bottom-0 left-0 w-64 h-64 bg-[#3CBFAC]/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        {/* Header utilities */}
        <div className="flex justify-between items-center w-full z-10">
          <div className="flex lg:hidden items-center gap-2">
            <SpeeHiveMark className="h-8 w-8" />
            <span className="font-bold text-base tracking-tight">SpeeHive Control</span>
          </div>
          <div className="ml-auto">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Centered card container */}
        <div className="my-auto mx-auto w-full max-w-[400px] space-y-8 z-10 py-12">
          {/* Welcome title */}
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Get started"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {mode === "signin" 
                ? "Enter your credentials to access your unified workplace." 
                : "Create an account to begin configuring your control panels."}
            </p>
          </div>

          {/* Mode Switch Tab Button */}
          <div className="relative p-1 bg-muted rounded-xl flex items-center border border-border/50">
            {/* Sliding background layer */}
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card rounded-lg shadow-sm transition-all duration-300 ease-out border border-border/30 ${
                mode === "signup" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
              }`}
            />
            <button
              onClick={() => { setMode("signin"); setError(""); setMessage(""); }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg relative z-10 transition-colors duration-200 ${
                mode === "signin" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg relative z-10 transition-colors duration-200 ${
                mode === "signup" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Microsoft Entra ID OAuth Sign-In */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border/80 bg-card hover:bg-muted/80 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm active:scale-[0.98] cursor-pointer group hover:border-primary/30"
            >
              <MicrosoftIcon className="h-5 w-5 shrink-0" />
              <span>Continue with Microsoft Entra ID</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-border/60 w-full" />
              <span className="bg-background px-3 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider relative z-10">
                Or with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wide uppercase text-muted-foreground/80" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60 group-focus-within:text-primary transition-colors">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-border-hover transition-all shadow-sm"
                  placeholder="name@speehive.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold tracking-wide uppercase text-muted-foreground/80" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60 group-focus-within:text-primary transition-colors">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-input bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-border-hover transition-all shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5 animate-fadeIn duration-200">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success notifications */}
            {message && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2.5 animate-fadeIn duration-200">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/10 disabled:opacity-60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98] overflow-hidden flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === "signin" ? "Sign in to Cockpit" : "Create Admin Account"}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Alternate flow link */}
          <div className="text-center">
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold hover:underline underline-offset-4 transition-colors"
            >
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Small terms link for mobile */}
        <div className="text-center text-[10px] text-muted-foreground/60 w-full mt-auto pt-6 block lg:hidden">
          &copy; {new Date().getFullYear()} SpeeHive. All rights reserved.
        </div>
      </div>
    </div>
  );
}
