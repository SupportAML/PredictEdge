"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";

const plans = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    features: {
      "Market Explorer": true,
      Alerts: "3",
      Data: "Delayed",
      "Portfolio Tracking": false,
      "Tax Reports": false,
      "AI Value Scores": false,
      "Cross-Platform Arb": false,
      "API Access": false,
    },
  },
  {
    name: "Pro",
    monthly: 19,
    annual: 15,
    popular: true,
    features: {
      "Market Explorer": true,
      Alerts: "Unlimited",
      Data: "Real-time",
      "Portfolio Tracking": true,
      "Tax Reports": true,
      "AI Value Scores": false,
      "Cross-Platform Arb": false,
      "API Access": false,
    },
  },
  {
    name: "Elite",
    monthly: 49,
    annual: 39,
    features: {
      "Market Explorer": true,
      Alerts: "Unlimited",
      Data: "Real-time",
      "Portfolio Tracking": true,
      "Tax Reports": true,
      "AI Value Scores": true,
      "Cross-Platform Arb": true,
      "API Access": true,
    },
  },
];

export function PricingToggle() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-12">
        <span
          className={`text-sm font-medium transition-colors ${!annual ? "text-white" : "text-neutral-500"}`}
        >
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative h-7 w-12 rounded-full transition-colors ${annual ? "bg-emerald-500" : "bg-neutral-700"}`}
          aria-label="Toggle annual pricing"
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform ${annual ? "translate-x-5" : ""}`}
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors ${annual ? "text-white" : "text-neutral-500"}`}
        >
          Annual{" "}
          <span className="text-emerald-400 text-xs font-semibold">
            Save 20%
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-8 transition-all ${
              plan.popular
                ? "border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white tracking-tight">
                  ${annual ? plan.annual : plan.monthly}
                </span>
                {plan.monthly > 0 && (
                  <span className="text-neutral-500 text-sm">/mo</span>
                )}
              </div>
              {annual && plan.monthly > 0 && (
                <p className="text-emerald-400 text-xs mt-1">
                  ${(annual ? plan.annual : plan.monthly) * 12}/year
                </p>
              )}
            </div>

            <a
              href="/sign-up"
              className={`block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors mb-6 ${
                plan.popular
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {plan.monthly === 0 ? "Get Started Free" : `Start ${plan.name}`}
            </a>

            <div className="space-y-3">
              {Object.entries(plan.features).map(([feature, value]) => (
                <div key={feature} className="flex items-center gap-3 text-sm">
                  {value === false ? (
                    <Minus className="size-4 text-neutral-600 shrink-0" />
                  ) : (
                    <Check className="size-4 text-emerald-400 shrink-0" />
                  )}
                  <span
                    className={
                      value === false ? "text-neutral-600" : "text-neutral-300"
                    }
                  >
                    {feature}
                    {typeof value === "string" && (
                      <span className="text-neutral-500 ml-1">({value})</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
