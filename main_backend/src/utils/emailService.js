const nodemailer = require('nodemailer');

const EMAIL_CONFIG = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
};

const createTransporter = () => {
    return nodemailer.createTransport({
        service: EMAIL_CONFIG.service,
        auth: {
            user: EMAIL_CONFIG.user,
            pass: EMAIL_CONFIG.pass,
        },
    });
};

const getInvitationEmailTemplate = (data) => {
    const { organizationName, inviterName, invitationId, role } = data;
    const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation/${invitationId}`;

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
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #ea580c;
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>You've been invited to join ${organizationName}</h1>
                    <p>${inviterName} has invited you to join ${organizationName} as a ${role.toLowerCase()}.</p>
                    <p>Click the button below to accept the invitation:</p>
                    <a href="${acceptUrl}" class="button">Accept Invitation</a>
                    <p>This invitation will expire in 7 days.</p>
                </div>
            </body>
            </html>
        `
    };
};

const sendInvitationEmail = async (invitation, organization, inviter) => {
    try {
        const transporter = createTransporter();
        
        const emailTemplate = getInvitationEmailTemplate({
            organizationName: organization.name,
            inviterName: inviter.name || inviter.email,
            invitationId: invitation.id,
            role: invitation.role
        });

        await transporter.sendMail({
            from: EMAIL_CONFIG.user,
            to: invitation.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html
        });

        return true;
    } catch (error) {
        console.error('Error sending invitation email:', error);
        return false;
    }
};

module.exports = {
    sendInvitationEmail
};