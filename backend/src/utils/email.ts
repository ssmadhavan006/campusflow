import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    // Fallback/Dev mode using Ethereal email
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('\n--- [EMAIL SERVICE] Created Ethereal Test Account ---');
      console.log('Preview URL available after sending the first email.');
      console.log('---------------------------------------------------\n');

      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.error('Failed to create Ethereal SMTP transporter, falling back to mock transporter', err);
      // Mock transporter that logs to console
      transporter = {
        sendMail: async (options: any) => {
          console.log('\n--- [MOCK EMAIL SENDER] ---');
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`Body:\n${options.text || options.html}`);
          console.log('---------------------------\n');
          return { messageId: 'mock-id' };
        }
      } as any;
    }
  }

  return transporter!;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  try {
    const client = await getTransporter();
    const from = process.env.SMTP_FROM || 'no-reply@campusflow.com';
    const info = await client.sendMail({
      from: `"CampusFlow" <${from}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Message sent: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL PREVIEW URL] View email: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
}
