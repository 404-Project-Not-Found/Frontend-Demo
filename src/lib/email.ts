/**
 * File path: /lib/emails.ts
 * Author: Denise Alexander
 * Date Created: 17/09/2025
 */

/* import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendResetEmail = async (to: string, resetLink: string) => {
  await transporter.sendMail({
    from: `"Scheduling of Care" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset your Password',
    html: `<p>Click the link below to reset your password:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p> This link will expire in 15 minutes.</p>`,
  });
};
*/
