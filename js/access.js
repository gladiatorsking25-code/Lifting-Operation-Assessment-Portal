// Shared sign-in and subscription routing for the Google Sheets backend.
(function (global) {
  'use strict';

  function sheetsOn() {
    return typeof SHEETS_READY !== 'undefined' && SHEETS_READY;
  }
  function cfg() {
    return (typeof SUBSCRIPTION_CONFIG !== 'undefined') ? SUBSCRIPTION_CONFIG : {
      LOGIN_PAGE: 'login.html', PAYWALL_PAGE: 'subscribe.html', ADMIN_PAGE: 'admin.html'
    };
  }
  function currentPage() { return location.pathname.split('/').pop() || 'index.html'; }
  function enc(s) { return encodeURIComponent(s); }
  function go(page) {
    if (currentPage() !== page.split('?')[0]) location.replace(page);
  }
  function cloudSignedIn() {
    try { return localStorage.getItem('cla_cloud_signed_in') === '1'; } catch (e) { return false; }
  }

  // ---- The gate for ordinary protected pages -------------------------------
  function requireAccess() {
    if (!sheetsOn()) {
      if (typeof requireAuth === 'function') requireAuth();
      return;
    }
    const c = cfg();
    const page = currentPage();

    // Synchronous, optimistic routing from cached flags so there's no flash of
    // app content for a signed-out or locked user. The async check below is the
    // authoritative one.
    if (!cloudSignedIn()) { go(c.LOGIN_PAGE + '?next=' + enc(page + location.search)); return; }
    const cached = Entitlements.cachedAccess();
    if (cached && !cached.hasAccess && page !== c.PAYWALL_PAGE) {
      go(c.PAYWALL_PAGE + '?next=' + enc(page + location.search)); return;
    }

    armAuthWatch(function (user, access) {
      if (!user) { go(c.LOGIN_PAGE + '?next=' + enc(page + location.search)); return; }
      if (access && !access.hasAccess && page !== c.PAYWALL_PAGE) {
        go(c.PAYWALL_PAGE + '?next=' + enc(page + location.search));
      }
    });
  }

  // ---- Helper for login.html: if already signed in AND has access, leave ----
  function handleLoginPage(onReady) {
    if (!sheetsOn()) { if (onReady) onReady('local'); return; }
    armAuthWatch(function (user, access) {
      if (user && access && access.hasAccess) {
        const next = new URLSearchParams(location.search).get('next');
        go(next && /^[\w.-]+\.html/.test(next) ? next : 'index.html');
      } else if (user && access && !access.hasAccess) {
        go(cfg().PAYWALL_PAGE);
      } else if (onReady) {
        onReady('sheets');
      }
    });
  }

  // ---- Helper for subscribe.html (paywall): require sign-in; leave if OK ----
  function handlePaywallPage(cb) {
    if (!sheetsOn()) { if (cb) cb({ configured: false }); return; }
    if (!cloudSignedIn()) { go(cfg().LOGIN_PAGE + '?next=' + enc(cfg().PAYWALL_PAGE)); return; }
    armAuthWatch(function (user, access, doc) {
      if (!user) { go(cfg().LOGIN_PAGE + '?next=' + enc(cfg().PAYWALL_PAGE)); return; }
      if (access && access.hasAccess && access.state !== 'trial') {
        // Already fully entitled (paid/admin/grant) — no need for the paywall.
        go('index.html'); return;
      }
      if (cb) cb({ configured: true, user: user, access: access, doc: doc });
    });
  }

  // ---- Helper for admin.html: require sign-in AND admin role ----------------
  function handleAdminPage(cb) {
    if (!sheetsOn()) { if (cb) cb({ configured: false }); return; }
    if (!cloudSignedIn()) { go(cfg().LOGIN_PAGE + '?next=' + enc(cfg().ADMIN_PAGE)); return; }
    armAuthWatch(function (user, access, doc) {
      if (!user) { go(cfg().LOGIN_PAGE + '?next=' + enc(cfg().ADMIN_PAGE)); return; }
      const isAdmin = doc && doc.role === 'admin';
      if (cb) cb({ configured: true, user: user, isAdmin: isAdmin, doc: doc });
    });
  }

  // ---- Shared Google Sheets auth + entitlement watcher --------------------------
  // Wires one onAuthStateChanged and, per signed-in user, one entitlement
  // snapshot listener. Calls cb(user, access, doc) on every meaningful change.
  let _armed = false;
  function armAuthWatch(cb) {
    sheetsReadyPromise.then(function (fb) {
      if (!fb) { cb(null, null, null); return; }
      fb.auth().onAuthStateChanged(function (user) {
        if (!user) {
          try { localStorage.removeItem('cla_cloud_signed_in'); } catch (e) {}
          Entitlements.clearCache();
          Entitlements.stop();
          cb(null, null, null);
          return;
        }
        try { localStorage.setItem('cla_cloud_signed_in', '1'); } catch (e) {}
        Entitlements.watch(user.uid, function (access, doc) {
          cb(user, access, doc);
        });
      });
      _armed = true;
    }).catch(function (err) {
      console.error('Access watch failed to start', err);
      cb(null, null, null);
    });
  }

  async function signOut() {
    try { if (typeof CloudAuth !== 'undefined') await CloudAuth.signOutCloud(); } catch (e) { alert('Sign out could not reach the server. Please retry when connected.'); return; }
    try { if (typeof AUTH !== 'undefined') AUTH.logout(); } catch (e) { /* ignore */ }
    Entitlements.clearCache();
    try { localStorage.removeItem('cla_cloud_signed_in'); } catch (e) {}
    location.href = cfg().LOGIN_PAGE;
  }

  global.requireAccess = requireAccess;
  global.Access = {
    sheetsOn: sheetsOn,
    requireAccess: requireAccess,
    handleLoginPage: handleLoginPage,
    handlePaywallPage: handlePaywallPage,
    handleAdminPage: handleAdminPage,
    armAuthWatch: armAuthWatch,
    signOut: signOut
  };
})(window);
