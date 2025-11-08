# GCP Email Function

This Cloud Function handles sending invitation emails for CrowdGuard.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.yaml` file with your email credentials:

```yaml
EMAIL_SERVICE: gmail
EMAIL_USER: your-email@gmail.com
EMAIL_PASS: your-app-specific-password
```

**For Gmail:**
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > 2-Step Verification > App passwords
4. Generate a new app password for "Mail"
5. Use that 16-character password in `.env.yaml`

### 3. Test Locally

Start the Functions Framework:
```bash
npx @google-cloud/functions-framework --target=sendEmail --port=8080
```

In another terminal, run the test:
```bash
npm test
```

### 4. Deploy to GCP

First, authenticate:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

Deploy the function:
```bash
npm run deploy
```

Or manually:
```bash
gcloud functions deploy sendEmail \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point sendEmail \
  --set-env-vars EMAIL_SERVICE=gmail,EMAIL_USER=your-email@gmail.com,EMAIL_PASS=your-app-password
```

### 5. Get the Function URL

After deployment, you'll get a URL like:
```
https://REGION-PROJECT_ID.cloudfunctions.net/sendEmail
```

Add this URL to your backend `.env` file:
```
GCP_EMAIL_FUNCTION_URL=https://your-function-url
```

## API Usage

### Request
```json
POST /sendEmail
Content-Type: application/json

{
  "to": "user@example.com",
  "templateType": "invitation",
  "templateData": {
    "organizationName": "My Organization",
    "inviterName": "John Doe",
    "acceptUrl": "https://app.com/invite/accept/token123",
    "rejectUrl": "https://app.com/invite/reject/token123",
    "expiryDays": 7
  }
}
```

### Response
```json
{
  "success": true,
  "messageId": "message-id",
  "message": "Email sent successfully"
}
```

## Security Notes

- Never commit `.env.yaml` with real credentials
- Use Secret Manager in production
- Consider adding authentication token validation
- Set up proper IAM roles

## Troubleshooting

**"Email service not configured" error:**
- Check that EMAIL_USER and EMAIL_PASS are set
- Verify environment variables in GCP Console

**"Authentication failed" error:**
- Use App-Specific Password, not your regular Gmail password
- Ensure 2FA is enabled on your Google account

**"Invalid login" error:**
- Check if "Less secure app access" is required (not recommended)
- Use App Passwords instead
