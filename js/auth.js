const AUTH = { SESSION_KEY: 'cla_auth_ok', isLoggedIn() { return sessionStorage.getItem(this.SESSION_KEY) === '1'; }, login() { return false; }, logout() { sessionStorage.removeItem(this.SESSION_KEY); } };
function requireAuth() { if (!AUTH.isLoggedIn()) location.replace('login.html'); }
