import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export type SendPasswordResetEmailParams = {
  to: string;
  url: string;
  userName?: string;
};

export async function sendPasswordResetEmail({
  to,
  url,
  userName,
}: SendPasswordResetEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const from = process.env.EMAIL_FROM || "Luma <onboarding@resend.dev>";
  const recipientName = userName || "Reader";

  if (
    !resend ||
    to.endsWith("@example.com") ||
    process.env.NODE_ENV === "test"
  ) {
    console.log(`[Email Mock] Password reset link for ${to}: ${url}`);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: "Reset your Luma password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1c1917; background-color: #fafaf9; border-radius: 16px;">
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #0c0a09;">Luma Scripture</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #44403c; margin-top: 16px;">
            Hello ${recipientName},
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #44403c;">
            We received a request to reset your password for your Luma Scripture account. Click the button below to establish a new password:
          </p>
          <div style="margin: 28px 0;">
            <a href="${url}" style="display: inline-block; background-color: #ca8a04; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 13px; line-height: 1.5; color: #78716c;">
            If you did not request a password reset, you can safely ignore this email. This link will expire in 1 hour.
          </p>
          <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
          <p style="font-size: 11px; color: #a8a29e;">
            Button not working? Copy and paste this URL into your browser:<br />
            <a href="${url}" style="color: #ca8a04; word-break: break-all;">${url}</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[Email] Failed to send password reset email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[Email] Unexpected error sending reset email:", message);
    return { success: false, error: message };
  }
}
