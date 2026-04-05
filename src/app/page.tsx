import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Bell,
  ArrowLeftRight,
  Brain,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { PricingToggle } from "@/components/landing/pricing-toggle";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import { WaitlistForm } from "@/components/landing/waitlist-form";

const features = [
  {
    icon: BarChart3,
    title: "Portfolio Dashboard",
    description:
      "Connect your Kalshi account via API. See real-time P&L, win rate, ROI by category, max drawdown, and performance over time. No more spreadsheets.",
  },
  {
    icon: FileText,
    title: "Tax Report Generator",
    description:
      "Auto-import trades. Calculate cost basis and gains/losses per contract. Export Schedule D-ready reports as CSV or PDF. What takes hours takes 30 seconds.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description:
      "Set price-level triggers on any contract. Get notified on volume spikes. Track new markets by category. Email and in-app notifications.",
  },
  {
    icon: ArrowLeftRight,
    title: "Cross-Platform Odds",
    description:
      "Compare the same event across Kalshi, Polymarket, and DraftKings. Spot arbitrage opportunities. Find best execution.",
  },
  {
    icon: Brain,
    title: "AI Value Scores",
    tag: "Elite",
    description:
      "Our model compares market odds to derived probabilities. Surface +EV opportunities before the crowd moves.",
  },
];

const problems = [
  {
    icon: FileText,
    title: "No tax reporting",
    description:
      "Kalshi doesn't issue 1099-Bs. CPAs charge $500+ to reconstruct your trades.",
  },
  {
    icon: TrendingUp,
    title: "No real analytics",
    description:
      "Your dashboard is a monthly P&L summary. No Sharpe ratio. No drawdown. No win rate by category.",
  },
  {
    icon: ArrowLeftRight,
    title: "No cross-platform view",
    description:
      "3 major platforms, zero unified analytics. Dome was acquired by Polymarket.",
  },
  {
    icon: Zap,
    title: "No smart alerts",
    description:
      "Basic push notifications. No price-level triggers. No volume spike detection.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <TrendingUp className="size-4 text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              PredictEdge
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium tracking-wide uppercase">
              Built for the $200B+ prediction market economy
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Stop trading prediction
            <br />
            markets{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              blind.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            PredictEdge is the all-in-one analytics platform for Kalshi,
            Polymarket, and DraftKings. Portfolio tracking. Tax reports. Smart
            alerts. AI-powered value detection.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3 rounded-xl text-base transition-colors flex items-center gap-2"
            >
              Get Started Free <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#features"
              className="text-neutral-400 hover:text-white text-sm font-medium transition-colors"
            >
              See features
            </Link>
          </div>
        </div>
      </section>

      {/* Ticker bar */}
      <div className="border-y border-white/5 bg-white/[0.01] py-4 overflow-hidden">
        <div className="flex items-center justify-center gap-12 text-xs text-neutral-500 font-mono">
          <span>
            KALSHI <span className="text-emerald-400">CONNECTED</span>
          </span>
          <span className="text-white/10">|</span>
          <span>
            POLYMARKET <span className="text-emerald-400">CONNECTED</span>
          </span>
          <span className="text-white/10">|</span>
          <span>
            DRAFTKINGS <span className="text-yellow-500">COMING SOON</span>
          </span>
          <span className="text-white/10">|</span>
          <span>
            170+ TOOLS ANALYZED <span className="text-neutral-600">&bull;</span>{" "}
            1 PLATFORM BUILT
          </span>
        </div>
      </div>

      {/* Problem */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              The tooling is{" "}
              <span className="text-red-400 line-through decoration-red-400/50">
                broken
              </span>
              .
            </h2>
            <p className="text-neutral-500 text-base">
              170+ fragmented tools exist. None do everything. Until now.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {problems.map((problem) => (
              <div
                key={problem.title}
                className="group border border-white/5 rounded-xl p-6 bg-white/[0.01] hover:border-red-500/20 hover:bg-red-500/[0.02] transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <problem.icon className="size-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {problem.title}
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {problem.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need.
              <br />
              <span className="text-neutral-500">Nothing you don&apos;t.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group border border-white/5 rounded-xl p-6 bg-white/[0.01] hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <feature.icon className="size-5 text-emerald-400" />
                  </div>
                  {feature.tag && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {feature.tag}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-1">$200B+</div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">
                Market Volume
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">170+</div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">
                Tools Analyzed
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">30s</div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">
                Tax Report Time
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                $500+
              </div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">
                CPA Fees Saved
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security callout */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="border border-emerald-500/20 rounded-2xl p-8 bg-emerald-500/[0.03] flex items-start gap-4">
            <Shield className="size-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">
                Read-only API access. Always.
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                PredictEdge can view your trades but never place orders or
                withdraw funds. Your API keys are encrypted at rest and in
                transit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Simple pricing. No hidden fees.
            </h2>
            <p className="text-neutral-500 text-base mb-2">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>
          <PricingToggle />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Questions? Answers.
            </h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            The Action Network for
            <br />
            prediction markets.
          </h2>
          <p className="text-neutral-400 text-base mb-10 max-w-xl mx-auto leading-relaxed">
            Action Network proved this model in sports betting — $40M ARR, $240M
            exit. Prediction markets are now bigger. Don&apos;t get left behind.
          </p>
          <div className="flex flex-col items-center gap-6">
            <Link
              href="/sign-up"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3 rounded-xl text-base transition-colors flex items-center gap-2"
            >
              Get Started Free <ArrowRight className="size-4" />
            </Link>
            <div className="text-neutral-600 text-xs">or join the waitlist</div>
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-emerald-500 flex items-center justify-center">
              <TrendingUp className="size-3.5 text-black" />
            </div>
            <span className="font-semibold text-sm">PredictEdge</span>
          </div>
          <p className="text-neutral-600 text-xs">
            &copy; {new Date().getFullYear()} PredictEdge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
