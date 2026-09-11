// Access is read from the private Sheets server. UI checks never authorize server operations.
const Entitlements = (function () {
  'use strict';

  const CACHE_KEY = 'cla_access_cache'; // {state, hasAccess, until, uid, ts}
  let _current = null;
  let _currentDoc = null;
  let _unsub = null;

  // The heart of it — a pure function so it can be tested without Google Sheets.
  // Order matters: admin role wins, then a manual admin grant, then a paid
  // subscription, then the free trial, else locked.
  function computeAccess(userDoc, nowMs) {
    const now = nowMs || Date.now();
    const u = userDoc || {};
    const paidStatuses = (typeof SUBSCRIPTION_CONFIG !== 'undefined' && SUBSCRIPTION_CONFIG.PAID_STATUSES) || ['active', 'in_grace'];

    // 0. Brand-new account whose trial hasn't been stamped by the server yet.
    //    The onUserCreate Cloud Function writes role + trial within a second or
    //    so of signup, but the client can read the doc before that lands. A doc
    //    with none of the entitlement fields = "just created" → let it through;
    //    the live snapshot corrects to 'trial' the moment the trigger writes. A
    //    genuinely locked account always has entitlement fields, so it is never
    //    mistaken for pending.
    const hasEntitlementField = !!(u.role || u.subscriptionStatus || u.trialEndsAt || u.adminGrantUntil || u.compForever);
    if (!hasEntitlementField) return mk('pending', false, null);
    if (u.subscriptionStatus === 'revoked' && u.role !== 'admin') return mk('locked', false, null);

    // 1. Owner / admin — always full access, never gated.
    if (u.role === 'admin') return mk('admin', true, null);

    // 2. Manual admin grant / comp (an owner gave this account access until a date).
    const grant = num(u.adminGrantUntil);
    if (grant && grant > now) return mk('granted', true, grant);
    // A permanent comp (grant with no end date).
    if (u.adminGrantUntil === 'forever' || u.compForever === true) return mk('granted', true, null);

    // 3. Active paid subscription (verified by the Cloud Function).
    const exp = num(u.subscriptionExpiryMillis);
    const status = u.subscriptionStatus || '';
    if (paidStatuses.indexOf(status) !== -1) {
      if (!exp) return mk('locked', false, null);       // active, expiry not yet known
      if (exp > now) return mk('active', true, exp);   // active and not expired
    }

    // 4. Free trial still running.
    const trialEnd = num(u.trialEndsAt);
    if (trialEnd && trialEnd > now) return mk('trial', true, trialEnd);

    // 5. Otherwise locked — trial ended and no active subscription.
    return mk('locked', false, null);
  }

  function mk(state, hasAccess, until) {
    return { state: state, hasAccess: !!hasAccess, until: until || null };
  }
  function num(v) {
    if (v == null) return 0;
    const n = Number(v);
    return isFinite(n) ? n : 0;
  }

  // Whole days remaining until `untilMs` (>=0), or null.
  function daysLeft(untilMs, nowMs) {
    if (!untilMs) return null;
    const ms = untilMs - (nowMs || Date.now());
    return ms <= 0 ? 0 : Math.ceil(ms / 86400000);
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; }
  }
  function writeCache(access, uid) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.assign({}, access, { uid: uid, ts: Date.now() })));
    } catch (e) { /* ignore */ }
  }
  function clearCache() {
    try { localStorage.removeItem(CACHE_KEY); } catch (e) { /* ignore */ }
  }

  // Optimistic access from the cache, so a page can render without waiting for
  // the network. This is a UX convenience only — the live watch() below
  // corrects it, and the server rules are the real enforcement.
  function cachedAccess(uid) {
    const c = readCache();
    if (!c || (uid && c.uid && c.uid !== uid)) return null;
    // Re-evaluate the cached `until` against the clock so an expired trial in a
    // stale cache doesn't read as still-valid.
    if (c.hasAccess && c.until && Number(c.until) <= Date.now()) {
      return mk(c.state === 'trial' ? 'locked' : c.state, false, null);
    }
    return mk(c.state, c.hasAccess, c.until);
  }

  // Live subscription to the user's entitlement document, MULTIPLEXED: several
  // parts of the app (the page gate, the sidebar status chip, the paywall) all
  // want to react to entitlement changes, so watch() keeps ONE Firestore
  // listener per uid and fans every update out to all registered callbacks.
  // Returns an unsubscribe that removes just that callback.
  let _cbs = [];
  let _watchUid = null;

  function _emit(access, doc) {
    _current = access;
    _currentDoc = doc;
    _cbs.slice().forEach(function (f) { try { f(access, doc); } catch (e) { console.error(e); } });
  }

  function watch(uid, cb) {
    if (typeof SHEETS_READY === 'undefined' || !SHEETS_READY) {
      const a = mk('unconfigured', true, null); // no backend yet → don't gate
      _current = a; if (cb) cb(a, null);
      return function () {};
    }
    if (cb) _cbs.push(cb);

    if (_watchUid !== uid) {
      _watchUid = uid;
      if (_unsub) { try { _unsub(); } catch (e) {} _unsub = null; }
      sheetsReadyPromise.then(function () {
        if (_watchUid !== uid) return; // switched again before the SDK was ready
        let stopped = false;
        async function refresh() {
          try {
            const { user: doc } = await SheetsBackend.call('me');
            if (stopped || _watchUid !== uid) return;
            const access = computeAccess(doc, Date.now());
            writeCache(access, uid); _emit(access, doc);
          } catch (err) {
            if (!stopped && _watchUid === uid) _emit(mk('unavailable', false, null), null);
          }
        }
        refresh();
        const timer = setInterval(refresh, SHEETS_CONFIG.pollMillis);
        _unsub = () => { stopped = true; clearInterval(timer); };
      });
    } else if (cb && _current) {
      try { cb(_current, _currentDoc); } catch (e) {} // deliver the current value at once
    }
    return function () { _cbs = _cbs.filter(function (f) { return f !== cb; }); };
  }

  function stop() {
    if (_unsub) { try { _unsub(); } catch (e) { /* ignore */ } _unsub = null; }
    _cbs = [];
    _watchUid = null;
    _current = null;
    _currentDoc = null;
  }

  function current() { return _current; }

  return {
    computeAccess: computeAccess,
    daysLeft: daysLeft,
    watch: watch,
    stop: stop,
    current: current,
    cachedAccess: cachedAccess,
    writeCache: writeCache,
    clearCache: clearCache
  };
})();
