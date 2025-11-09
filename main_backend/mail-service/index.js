const functions = require('@google-cloud/functions-framework');
const nodemailer = require('nodemailer');

// Email configuration from environment variables
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.pass,
    },
  });
};

// Email templates
const getInvitationEmailTemplate = (data) => {
  const { organizationName, inviterName, acceptUrl, rejectUrl, expiryDays } = data;

  return {
    subject: `Invitation to join ${organizationName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9fafb;
            border-radius: 10px;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ea580c;
            margin-bottom: 10px;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            margin-bottom: 15px;
            color: #4b5563;
          }
          .buttons {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            transition: all 0.3s;
          }
          .accept-button {
            background-color: #ea580c;
            color: white;
          }
          .accept-button:hover {
            background-color: #c2410c;
          }
          .reject-button {
            background-color: #6b7280;
            color: white;
          }
          .reject-button:hover {
            background-color: #4b5563;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .expiry-notice {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
          }
          .org-name {
            font-weight: bold;
            color: #ea580c;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CrowdGuard</div>
          </div>

          <div class="content">
            <h1>You've Been Invited! 🎉</h1>

            <p>Hi there,</p>

            <p>
              <strong>${inviterName}</strong> has invited you to join
              <span class="org-name">${organizationName}</span> on CrowdGuard.
            </p>

            <p>
              CrowdGuard is a comprehensive platform for managing crowd events,
              monitoring alerts, and coordinating team activities.
            </p>

            <div class="expiry-notice">
              ⏰ <strong>Note:</strong> This invitation expires in ${expiryDays} days.
            </div>

            <div class="buttons">
              <a href="${acceptUrl}" class="button accept-button">
                ✓ Accept Invitation
              </a>
              <a href="${rejectUrl}" class="button reject-button">
                ✗ Decline
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              If you don't want to join this organization, you can safely ignore this email
              or click the decline button.
            </p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} CrowdGuard. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
You've Been Invited to ${organizationName}!

${inviterName} has invited you to join ${organizationName} on CrowdGuard.

Accept Invitation: ${acceptUrl}
Decline Invitation: ${rejectUrl}

This invitation expires in ${expiryDays} days.

© ${new Date().getFullYear()} CrowdGuard. All rights reserved.
    `.trim()
  };
};

// Main Cloud Function
functions.http('sendEmail', async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { to, templateType, templateData } = req.body;

    // Validate input
    if (!to || !templateType) {
      res.status(400).json({ error: 'Missing required fields: to, templateType' });
      return;
    }

    // Validate email configuration
    if (!EMAIL_CONFIG.user || !EMAIL_CONFIG.pass) {
      console.error('Email configuration missing');
      res.status(500).json({ error: 'Email service not configured' });
      return;
    }

    // Get email template
    let emailContent;
    if (templateType === 'invitation') {
      emailContent = getInvitationEmailTemplate(templateData);
    } else {
      res.status(400).json({ error: 'Invalid template type' });
      return;
    }

    // Create transporter and send email
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"CrowdGuard" <${EMAIL_CONFIG.user}>`,
      to: to,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    console.log('Email sent successfully:', info.messageId);

    res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});
