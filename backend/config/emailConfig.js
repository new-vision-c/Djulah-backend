// config/emailConfig.js

import config from './index.js';

// Send email using HTTP API (bypasses SMTP port blocking on Render)
const sendEmailViaHTTP = async (options) => {
  // Use Resend HTTP API (no SMTP ports needed!)
  if (config.email.resendApiKey) {
    console.log('📧 Using Resend HTTP API (no SMTP ports - works on Render!)');
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.email.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Djulah <${config.email.from}>`,
          to: [options.to],
          subject: options.subject,
          html: options.html
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      console.log('✅ Email sent successfully via HTTP API:', data.id);
      return { success: true };
    } catch (error) {
      console.error('❌ Email error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Use Brevo HTTP API
  if (config.email.brevoApiKey) {
    console.log('📧 Using Brevo HTTP API (no SMTP ports - works on Render!)');
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': config.email.brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: 'Djulah',
            email: config.email.from || config.email.brevoEmail
          },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      console.log('✅ Email sent successfully via HTTP API:', data.messageId);
      return { success: true };
    } catch (error) {
      console.error('❌ Email error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Fallback error
  console.error('❌ No email provider configured (RESEND_API_KEY or BREVO_API_KEY required)');
  return { success: false, error: 'No email provider configured' };
};

const sendEmail = sendEmailViaHTTP;

const normalizeLocale = (locale) => {
  if (!locale || typeof locale !== 'string') return 'en';
  const l = locale.toLowerCase();
  if (l.startsWith('fr')) return 'fr';
  if (l.startsWith('en')) return 'en';
  return 'en';
};

export const sendVerificationEmail = async (email, code, name = '', locale = 'en') => {
  const l = normalizeLocale(locale);
  const safeName = (name && typeof name === 'string' && name.trim().length)
    ? name.trim()
    : (l === 'fr' ? 'là' : 'there');

  const subject = l === 'fr'
    ? 'Djulah - Code de vérification'
    : 'Djulah - Verification Code';

  const title = l === 'fr' ? 'Bienvenue sur Djulah !' : 'Welcome to Djulah!';
  const greeting = l === 'fr' ? `Bonjour ${safeName} !` : `Hello ${safeName}!`;
  const codeLabel = l === 'fr' ? 'Votre code de vérification est :' : 'Your verification code is:';
  const expiry = l === 'fr' ? 'Expire dans 10 minutes' : 'Expires in 10 minutes';

  const html = `
    <div style="max-width: 600px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.15); font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 40px 20px; text-align: center;">
        <h1>${title}</h1>
      </div>
      <div style="padding: 50px 30px; text-align: center;">
        <h2>${greeting}</h2>
        <p>${codeLabel}</p>
        <div style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #4CAF50; background: #f0f8f0; padding: 25px; border-radius: 16px; display: inline-block; margin: 25px 0;">
          ${code}
        </div>
        <p><strong>${expiry}</strong></p>
      </div>
      <div style="background: #1a1a1a; color: #aaa; padding: 25px; text-align: center; font-size: 13px;">
        <p>&copy; ${new Date().getFullYear()} Djulah</p>
      </div>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

export const sendPasswordResetEmail = async (email, code, name = '', locale = 'en') => {
  const l = normalizeLocale(locale);
  const safeName = (name && typeof name === 'string' && name.trim().length)
    ? name.trim()
    : (l === 'fr' ? 'là' : 'there');

  const subject = l === 'fr'
    ? 'Djulah - Code de réinitialisation du mot de passe'
    : 'Djulah - Password Reset Code';

  const title = l === 'fr' ? 'Réinitialisation du mot de passe' : 'Password Reset';
  const greeting = l === 'fr' ? `Bonjour ${safeName} !` : `Hello ${safeName}!`;
  const codeLabel = l === 'fr' ? 'Votre code de réinitialisation est :' : 'Your password reset code:';
  const expiry = l === 'fr' ? 'Valable uniquement 10 minutes' : 'Valid for 10 minutes only';

  const html = `
    <div style="max-width: 600px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.15); font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #e91e63, #c2185b); color: white; padding: 40px 20px; text-align: center;">
        <h1>${title}</h1>
      </div>
      <div style="padding: 50px 30px; text-align: center;">
        <h2>${greeting}</h2>
        <p>${codeLabel}</p>
        <div style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #e91e63; background: #fce4ec; padding: 25px; border-radius: 16px; display: inline-block; margin: 25px 0;">
          ${code}
        </div>
        <p><strong>${expiry}</strong></p>
      </div>
      <div style="background: #1a1a1a; color: #aaa; padding: 25px; text-align: center; font-size: 13px;">
        <p>&copy; ${new Date().getFullYear()} Djulah</p>
      </div>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
};

export const sendKycSubmissionEmail = async () => ({
  success: false,
  error: 'Disabled: KYC emails are not used by the auth-only backend'
});

export const sendKycApprovalEmail = async () => ({
  success: false,
  error: 'Disabled: KYC emails are not used by the auth-only backend'
});

export const sendKycRejectionEmail = async () => ({
  success: false,
  error: 'Disabled: KYC emails are not used by the auth-only backend'
});

export const sendUserInvitationEmail = async () => ({
  success: false,
  error: 'Disabled: invitation emails are not used by the auth-only backend'
});

/*
The following email helpers were used by the previous restaurant/host backend.
They are disabled for the Djulah auth-only backend.

// KYC Submission Email
export const sendKycSubmissionEmail = async (email, firstName) => {
  const html = `
    <div style="max-width: 600px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.15); font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 40px 20px; text-align: center;">
        <h1>KYC Submitted Successfully!</h1>
      </div>
      <div style="padding: 50px 30px;">
        <h2>Hello ${firstName}!</h2>
        <p>Your KYC submission has been received and is now under review by our team.</p>
        <p>We typically review submissions within 24-48 hours. You'll receive an email once the review is complete.</p>
        <p><strong>What happens next?</strong></p>
        <ul style="text-align: left; line-height: 1.8;">
          <li>Our team will verify your documents</li>
          <li>You'll receive an approval or feedback email</li>
          <li>Once approved, you'll gain full access to the platform</li>
        </ul>
      </div>
      <div style="background: #1a1a1a; color: #aaa; padding: 25px; text-align: center; font-size: 13px;">
        <p>&copy; ${new Date().getFullYear()} Klarity • Made in Cameroon</p>
      </div>
    </div>
  `;

  return await sendEmail({ to: email, subject: 'KYC Submission Received - Klarity', html });
};

// KYC Approval Email
export const sendKycApprovalEmail = async (email, firstName, restaurantName) => {
  const html = `
    <div style="max-width: 600px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.15); font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 40px 20px; text-align: center;">
        <h1>🎉 KYC Approved!</h1>
      </div>
      <div style="padding: 50px 30px;">
        <h2>Congratulations ${firstName}!</h2>
        <p>Your KYC submission has been <strong>approved</strong>!</p>
        <p>Your restaurant <strong>${restaurantName}</strong> is now active on Klarity.</p>
        <p><strong>You can now:</strong></p>
        <ul style="text-align: left; line-height: 1.8;">
          <li>Manage your ingredients and suppliers</li>
          <li>Track stock movements</li>
          <li>Invite team members to your restaurant</li>
          <li>Generate reports and analytics</li>
        </ul>
        <p style="margin-top: 30px; text-align: center;">
          <a href="${config.client.url}/login" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Access Your Dashboard
          </a>
        </p>
      </div>
      <div style="background: #1a1a1a; color: #aaa; padding: 25px; text-align: center; font-size: 13px;">
        <p>&copy; ${new Date().getFullYear()} Klarity • Made in Cameroon</p>
      </div>
    </div>
  `;

  return await sendEmail({ to: email, subject: 'Welcome to Klarity - KYC Approved! 🎉', html });
};

// KYC Rejection Email
export const sendKycRejectionEmail = async (email, firstName, reason) => {
  const html = `
    <div style="max-width: 600px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.15); font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #e91e63, #c2185b); color: white; padding: 40px 20px; text-align: center;">
        <h1>KYC Review Update</h1>
      </div>
      <div style="padding: 50px 30px;">
        <h2>Hello ${firstName},</h2>
        <p>Unfortunately, we were unable to approve your KYC submission at this time.</p>
        <p><strong>Reason:</strong></p>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          ${reason}
        </div>
        <p>Please review the feedback and submit a new KYC application with the necessary corrections.</p>
        <p style="margin-top: 30px; text-align: center;">
          <a href="${config.client.url}/kyc/submit" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Submit New KYC
          </a>
        </p>
      </div>
      <div style="background: #1a1a1a; color: #aaa; padding: 25px; text-align: center; font-size: 13px;">
        <p>&copy; ${new Date().getFullYear()} Klarity • Made in Cameroon</p>
      </div>
    </div>
  `;

  return await sendEmail({ to: email, subject: 'KYC Review Update - Klarity', html });
};

// User Invitation Email
export const sendUserInvitationEmail = async (email, restaurantName, inviterName, inviteToken) => {
  const inviteLink = `${config.client.url}/accept-invite/${inviteToken}`;

  const html = `
    <div style="max-width: 600px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.15); font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 40px 20px; text-align: center;">
        <h1>You're Invited!</h1>
      </div>
      <div style="padding: 50px 30px;">
        <h2>Hello!</h2>
        <p>${inviterName} has invited you to join <strong>${restaurantName}</strong> on Klarity Kitchen OS.</p>
        <p>Klarity helps restaurants manage their ingredients, suppliers, and stock efficiently.</p>
        <p style="margin-top: 30px; text-align: center;">
          <a href="${inviteLink}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
      <div style="background: #1a1a1a; color: #aaa; padding: 25px; text-align: center; font-size: 13px;">
        <p>&copy; ${new Date().getFullYear()} Klarity • Made in Cameroon</p>
      </div>
    </div>
  `;

  return await sendEmail({ to: email, subject: `You're invited to join ${restaurantName} on Klarity`, html });
};
*/