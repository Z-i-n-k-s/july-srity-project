const nodemailer = require("nodemailer");
const AppError = require("./AppError");

function createTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    throw new AppError("Email delivery is not configured on the server.", 503, "EMAIL_NOT_CONFIGURED");
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 465,
    secure: String(EMAIL_SECURE).toLowerCase() !== "false",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

async function sendPasswordResetEmail({ user, resetToken }) {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset your July Smriti Archive password",
      text: `Hello ${user.name}, use this link within 15 minutes to reset your password: ${resetUrl}`,
      html: `<p>Hello ${user.name},</p><p>Use the link below within 15 minutes to reset your password:</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
  } catch (error) {
    throw new AppError(
      `Password-reset email could not be delivered: ${error.message}`,
      502,
      "EMAIL_DELIVERY_FAILED"
    );
  }
}

module.exports = { sendPasswordResetEmail };
