import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 }
    );
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "PredictEdge <updates@apexmedlaw.com>",
      to: [email],
      cc: ["support@apexmedlaw.com"],
      subject: "Welcome to PredictEdge — You're on the list",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to PredictEdge</h1>
          <p style="color: #666; line-height: 1.6;">
            You've been added to the PredictEdge early access list. We'll notify you as soon as your account is ready.
          </p>
          <p style="color: #666; line-height: 1.6; margin-top: 16px;">
            In the meantime, you can sign up for a free account at
            <a href="https://predictedge.com/sign-up" style="color: #10b981;">predictedge.com</a>.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            — The PredictEdge Team
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Waitlist email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
