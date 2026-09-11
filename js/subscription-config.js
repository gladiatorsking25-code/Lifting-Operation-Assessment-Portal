// subscription-config.js — one place to configure the trial + subscription model.
//
// This file is safe to ship publicly: none of it is a secret. The real
// enforcement happens server-side (Firestore rules + Cloud Functions with the
// Admin SDK); these values only describe the product, drive the UI, and tell the
// billing code which Play products to buy.
//
// Everything here is dormant until Google Sheets is configured (js/sheets-config.js)
// — see SECURITY.md and GOOGLE_SHEETS_SETUP.md for the activation walkthrough.

const SUBSCRIPTION_CONFIG = {

  // ---- Trial ----
  // How long a brand-new account gets full access before a subscription is
  // required. The trial window is set SERVER-SIDE by the onUserCreate Cloud
  // Function (functions/index.js) so a user can't extend their own trial by
  // editing the client. This number must match TRIAL_DAYS there.
  TRIAL_DAYS: 14,

  // ---- Play Billing products ----
  // The subscription product IDs you create in Play Console → Monetize →
  // Subscriptions. The billing code (js/billing.js) offers these; the Cloud
  // Function verifies whichever one was purchased.
  PLAY_PACKAGE_NAME: 'Duck.HSE.Portal', // must match twa-manifest.json packageId
  PRODUCTS: [
    { id: 'pro_monthly', label: 'Monthly', period: 'P1M' },
    { id: 'pro_yearly',  label: 'Yearly',  period: 'P1Y' }
  ],

  // ---- Direct / offline payment (invoice, bank transfer, PayPal) ----
  // IMPORTANT: Google Play requires Play Billing for digital subscriptions sold
  // inside a Play-distributed app. This offline option is for DIRECT / B2B sales
  // and app builds distributed OUTSIDE Google Play. Payment is confirmed by you
  // and access is granted manually from the admin dashboard. Set enabled:false
  // to hide it (e.g. in the Play Store build) so you stay policy-compliant.
  OFFLINE_PAYMENT: {
    enabled: true,
    payerName: 'SABIR AMIN SHAHID AMIN',
    paypalEmail: 'sabiriis143@gmail.com',
    bank: {
      accountName: 'SABIR AMIN SHAHID AMIN',
      bankName: 'Commercial Bank of Dubai',
      iban: 'AE950230000001009935808',
      accountNumber: '1009935808',
      swift: 'CBDUAEAD',
      bankAddress: 'Al Ittihad Street, PO BOX 2668, Dubai, UAE'
    }
  },

  // ---- Grace / account states ----
  // Statuses that still count as paid access. 'in_grace' is Play's billing grace
  // period (payment failed but access continues briefly); 'on_hold' does NOT
  // grant access.
  PAID_STATUSES: ['active', 'in_grace'],

  // ---- Support contact shown on the paywall ----
  SUPPORT_EMAIL: 'sabiriis143@gmail.com',

  // ---- Where a user is sent when their trial ends and they aren't subscribed.
  PAYWALL_PAGE: 'subscribe.html',
  LOGIN_PAGE: 'login.html',
  ADMIN_PAGE: 'admin.html'
};
