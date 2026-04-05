"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is my Kalshi API key safe?",
    a: "Yes. We use read-only API access. PredictEdge can view your trades but never place orders or withdraw funds.",
  },
  {
    q: "Do I really need to report Kalshi taxes?",
    a: "Yes. All trading income is taxable. Kalshi doesn't issue 1099-Bs, so the burden is on you. PredictEdge automates the process.",
  },
  {
    q: "What platforms do you support?",
    a: "Kalshi is fully supported at launch. Polymarket and DraftKings cross-platform odds comparison is available now. Full portfolio tracking for those platforms is coming soon.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no commitment. Cancel in one click.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex items-center justify-between w-full px-6 py-4 text-left"
          >
            <span className="text-white font-medium text-sm">{faq.q}</span>
            <ChevronDown
              className={`size-4 text-neutral-500 shrink-0 ml-4 transition-transform ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          <div
            className={`grid transition-all duration-200 ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <p className="px-6 pb-4 text-neutral-400 text-sm leading-relaxed">
                {faq.a}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
