// functions/index.js — verifies a Google Play subscription purchase and
// updates the buyer's Firestore users/{uid}.subscriptionStatus accordingly.
// This is a SCAFFOLD: it's structured correctly and should work once you've
// completed the one-time setup below, but you must deploy it and do that
// setup yourself — I can't do either from here.
//
// ---- One-time setup (do this before deploying) ----
// 1. Upgrade the Firebase project to the "Blaze" (pay-as-you-go) plan.
//    Cloud Functions require Blaze even to deploy at all — but the free
//    tier included IN Blaze (2M invocations/month, etc.) means a small
//    subscriber base should cost close to $0/month; you're billed only for
//    usage beyond the free tier, not a flat fee for having Blaze enabled.
// 2. In Google Cloud Console (console.cloud.google.com), for the SAME
//    project as your Firebase app: APIs & Services → Library → enable
//    "Google Play Android Developer API".
// 3. In Google Play Console → Setup → API access, link this Google Cloud
//    project, then grant the Cloud Functions runtime service account
//    (typically PROJECT_ID@appspot.gserviceaccount.com, shown on the API
//    access page once linked) the "View financial data" permission. This
//    lets this function call the Play API without a separately downloaded
//    key file.
// 4. `firebase deploy --only functions` from this folder's parent directory.
//
// ---- Calling this from the app ----
// After a successful Play Billing purchase, the app (once you add the Play
// Billing / Digital Goods API calls in your TWA — see README) calls this
// function with the purchase token Play returns, e.g.:
//
//   const verify = firebase.functions().httpsCallable('verifyPlayPurchase');
//   const result = await verify({ packageName: 'com.yourcompany.craneapp',
//                                  subscriptionId: 'pro_monthly',
//                                  purchaseToken: token });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');

admin.initializeApp();

async function getAndroidPublisher() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
  });
  const authClient = await auth.getClient();
  return google.androidpublisher({ version: 'v3', auth: authClient });
}

exports.verifyPlayPurchase = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in before verifying a purchase.');
  }
  const { packageName, subscriptionId, purchaseToken } = data;
  if (!packageName || !subscriptionId || !purchaseToken) {
    throw new functions.https.HttpsError('invalid-argument', 'packageName, subscriptionId, and purchaseToken are all required.');
  }

  const androidpublisher = await getAndroidPublisher();
  let subscription;
  try {
    const res = await androidpublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken
    });
    subscription = res.data;
  } catch (err) {
    console.error('Play purchase verification failed', err);
    throw new functions.https.HttpsError('internal', 'Could not verify this purchase with Google Play.');
  }

  // paymentState: 0 = pending, 1 = received, 2 = free trial, 3 = pending deferred upgrade/downgrade.
  const isActive = subscription.expiryTimeMillis && Number(subscription.expiryTimeMillis) > Date.now();
  const status = isActive ? 'active' : 'expired';

  await admin.firestore().collection('users').doc(context.auth.uid).set({
    subscriptionStatus: status,
    subscriptionId,
    subscriptionExpiryMillis: subscription.expiryTimeMillis ? Number(subscription.expiryTimeMillis) : null,
    subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { status, expiryTimeMillis: subscription.expiryTimeMillis || null };
});

// ---- Optional but recommended once you're past MVP: Real-time Developer
// Notifications (RTDN). Play pushes an event here the moment a subscription
// renews, is cancelled, enters a billing grace period, etc., via Pub/Sub —
// without this, a cancelled subscription stays "active" in Firestore until
// the user happens to reopen the app and re-triggers verifyPlayPurchase.
// Wire-up (when you're ready): Play Console → Monetization setup → Real-time
// developer notifications → create a Pub/Sub topic, then deploy this as a
// Pub/Sub-triggered function subscribed to that topic. Left unimplemented
// here since it needs that topic to exist first.
//
// exports.playRTDN = functions.pubsub.topic('play-rtdn').onPublish(async (message) => {
//   const payload = JSON.parse(Buffer.from(message.data, 'base64').toString());
//   // payload.subscriptionNotification.{purchaseToken, subscriptionId, notificationType}
//   // Look up which uid owns this purchaseToken (store that mapping when you
//   // first verify a purchase) and re-run the same verification/update logic
//   // as verifyPlayPurchase above.
// });
