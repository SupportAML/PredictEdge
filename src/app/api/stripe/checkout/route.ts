import { NextResponse } from "next/server";

const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? "",
  },
  elite: {
    monthly: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID ?? "",
    annual: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID ?? "",
  },
};

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe not configured yet. Sign up for free instead." },
      { status: 503 }
    );
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { plan, billing } = await request.json();

  if (!plan || !PRICE_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const interval = billing === "annual" ? "annual" : "monthly";
  const priceId = PRICE_IDS[plan][interval];

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price IDs not configured yet" },
      { status: 503 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.headers.get("origin")}/dashboard?upgraded=true`,
      cancel_url: `${request.headers.get("origin")}/#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
