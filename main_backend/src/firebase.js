const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let credential;

// Try to load from JSON file first (more reliable)
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  credential = admin.credential.cert(serviceAccount);
} else {
  // Fallback to environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Missing Firebase credentials. Either place serviceAccountKey.json in the project root, or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    );
  }

  // Handle both escaped and unescaped newlines
  const privateKey = privateKeyRaw
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r');

  credential = admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  });
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential,
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || 'agentic-hacky'}.firebaseio.com`
  });
}

const db = admin.firestore();

// Set Firestore settings to avoid warnings
db.settings({
  ignoreUndefinedProperties: true,
});

module.exports = { admin, db };
