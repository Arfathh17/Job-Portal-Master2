const admin = require("firebase-admin");

let serviceAccount = null;
try {
  serviceAccount = require("./serviceAccountKey.json");
} catch (error) {
  console.warn("Firebase Admin: service account not found; Firestore-backed jobs will use demo fallback.");
}

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = serviceAccount ? admin.firestore() : null;

module.exports = db;
