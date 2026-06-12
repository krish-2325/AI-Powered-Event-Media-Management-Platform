// src/app/page.tsx

import Link from "next/link";
import { Camera, Zap, Shield, Users, Image, Search, Share2, ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-display text-foreground">PixVault</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-radial from-brand-500/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-3xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Event Media Management
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-display text-foreground tracking-tight mb-6 text-balance">
            Your club's{" "}
            <span className="gradient-text">memories,</span>
            <br />
            perfectly organized
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
            Upload, tag, and share event photos from Techfest, Diwali celebrations, Holi shoots, and college trips. AI automatically tags scenes so everyone finds their photos instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors shadow-glow"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/events"
              className="px-8 py-3.5 rounded-xl border border-border text-base font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
              Everything your club needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From upload to sharing, PixVault handles every step of your event media workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-6 card-hover">
                <div className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Ready to organize your memories?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
                Join photography clubs across Indian colleges already using PixVault to manage their event memories.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-brand-700 text-base font-bold hover:bg-white/90 transition-colors"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Camera className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">PixVault</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/auth/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: Image,
    title: "Bulk Upload & Auto-Process",
    desc: "Upload hundreds of photos from Techfest, Holi, Diwali, and college trips at once. Thumbnails and compressed previews are generated automatically.",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: Zap,
    title: "AI-Powered Tagging",
    desc: "AI automatically tags every photo — crowd, stage, festival, mountains, ghats — so you can search anything instantly. Powered by Hugging Face (free).",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Users,
    title: "Face Recognition",
    desc: "Club members upload a reference selfie. PixVault finds every photo they appear in — from Diwali walks to Ladakh expeditions — automatically.",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Shield,
    title: "Granular Access Control",
    desc: "Set Techfest photos as Public and internal workshops as Members-Only. Role-based permissions for club photographers and admins.",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Search,
    title: "Powerful Search",
    desc: "Find photos by tag (holi, ladakh, aarti), person, event category, or date range across all club events.",
    iconBg: "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    desc: "Share albums from Diwali shoots or college fests with a single link. Dynamic watermarks with club name and event protect your photographers' work.",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
];
