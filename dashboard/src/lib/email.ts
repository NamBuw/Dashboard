import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@ctslab.net";
const DASHBOARD_URL = process.env.AUTH_URL || "https://dashboard.ctslab.net";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export async function sendVerificationEmail(
  to: string,
  username: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${DASHBOARD_URL}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"PTalk" <${SMTP_FROM}>`,
      to,
      subject: "Xac thuc email tai khoan PTalk",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #333;">Xin chao ${username}!</h2>
          <p>Cam on ban da dang ky tai khoan PTalk. Vui long nhan nut ben duoi de xac thuc dia chi email:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" 
               style="background: #e53935; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Xac thuc Email
            </a>
          </div>
          <p style="color: #666; font-size: 13px;">
            Lien ket nay se het han sau 24 gio. Neu ban khong dang ky tai khoan PTalk, vui long bo qua email nay.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 11px;">PTalk - CTS Lab</p>
        </div>
      `,
    });
    console.log(`Verification email sent to ${to}`);
    return true;
  } catch (err) {
    console.error("Failed to send verification email:", err);
    // In development without SMTP, still return true so the flow continues
    // The token is stored in DB and can be accessed via the dev helper
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Verification URL: ${verifyUrl}`);
      return true;
    }
    return false;
  }
}
