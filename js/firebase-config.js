// firebase-config.js — fill this in with YOUR OWN Firebase project's config.
//
// Until you do (i.e. while apiKey below is still the placeholder), the app
// runs exactly as it did before this file existed: local-only storage, the
// existing username/password login gate, no cloud sync, zero extra network
// requests. Nothing about the app's current behaviour changes just because
// this file is present.
//
// To get real values:
//   1. Go to https://console.firebase.google.com and create a project
//      (the free "Spark" plan is enough for a small subscriber base).
//   2. Build → Authentication → Sign-in method → enable "Email/Password".
//   3. Build → Firestore Database → Create database (start in production
//      mode, then apply firestore.rules from this repo — see README).
//   4. Project settings (gear icon) → General → "Your apps" → Add app → Web
//      (</> icon). Firebase shows you a config object — paste its values in
//      below.
//
// See the README section "Cloud sync & accounts (Firebase)" for the full
// walkthrough, including Firestore security rules and cost expectations.

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
