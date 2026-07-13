const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

function createEncryptedStorage(filePath, safeStorage) {
  const memory = new Map();
  const encryptionAvailable = Boolean(safeStorage?.isEncryptionAvailable?.());
  function readAll() {
    try {
      if (!encryptionAvailable) return Object.fromEntries(memory);
      const encrypted = Buffer.from(fs.readFileSync(filePath, 'utf8'), 'base64');
      const plain = safeStorage.decryptString(encrypted);
      return JSON.parse(plain);
    } catch {
      return {};
    }
  }

  function writeAll(value) {
    if (!encryptionAvailable) {
      memory.clear();
      Object.entries(value).forEach(([key, item]) => memory.set(key, item));
      return;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const plain = JSON.stringify(value);
    const encrypted = safeStorage.encryptString(plain);
    fs.writeFileSync(filePath, encrypted.toString('base64'), 'utf8');
  }

  return {
    getItem(key) { return readAll()[key] || null; },
    setItem(key, value) { const data = readAll(); data[key] = value; writeAll(data); },
    removeItem(key) { const data = readAll(); delete data[key]; writeAll(data); }
  };
}

function readBuildConfig(configPath) {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

function createSocialService({ dataDir, safeStorage, openExternal, env = process.env, configPath = '' }) {
  const buildConfig = readBuildConfig(configPath);
  const url = String(env.DOMODORO_SUPABASE_URL || buildConfig.supabaseUrl || '').trim();
  const anonKey = String(env.DOMODORO_SUPABASE_ANON_KEY || buildConfig.supabaseAnonKey || '').trim();
  const configured = Boolean(url && anonKey);
  let client = null;
  let currentSession = null;

  if (configured) {
    client = createClient(url, anonKey, {
      auth: {
        storage: createEncryptedStorage(path.join(dataDir, 'social-session.dat'), safeStorage),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      }
    });
    client.auth.onAuthStateChange((_event, session) => { currentSession = session; });
  }

  function requireClient() {
    if (!client) throw new Error('Cloud service is not configured for this build.');
    return client;
  }

  async function session() {
    if (!client) return null;
    if (currentSession) return currentSession;
    const { data } = await client.auth.getSession();
    currentSession = data.session;
    return currentSession;
  }

  async function getDashboard() {
    const activeSession = await session();
    if (!activeSession) return { configured, authenticated: false, profile: null, squad: null, members: [] };
    const api = requireClient();
    const { data: profile } = await api.from('profiles').select('*').eq('id', activeSession.user.id).maybeSingle();
    const { data: membership } = await api.from('squad_members').select('squad_id, role, squads(*)').eq('user_id', activeSession.user.id).maybeSingle();
    if (!membership?.squad_id) return { configured, authenticated: true, profile, squad: null, members: [] };
    const { data: members, error } = await api
      .from('squad_weekly_leaderboard')
      .select('*')
      .eq('squad_id', membership.squad_id)
      .order('weekly_score', { ascending: false });
    if (error) throw error;
    return { configured, authenticated: true, profile, squad: membership.squads, role: membership.role, members: members || [] };
  }

  return {
    configured,
    getCachedState() {
      return { configured, authenticated: Boolean(currentSession), userId: currentSession?.user?.id || null };
    },
    async getState() { return getDashboard(); },
    async requestEmailCode(email) {
      const { error } = await requireClient().auth.signInWithOtp({ email: String(email || '').trim(), options: { shouldCreateUser: true } });
      if (error) throw error;
      return { ok: true };
    },
    async verifyEmailCode(email, token) {
      const { data, error } = await requireClient().auth.verifyOtp({ email: String(email || '').trim(), token: String(token || '').trim(), type: 'email' });
      if (error) throw error;
      currentSession = data.session;
      return getDashboard();
    },
    async startGithubLogin() {
      const { data, error } = await requireClient().auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: 'domodoro://auth/callback', skipBrowserRedirect: true }
      });
      if (error) throw error;
      await openExternal(data.url);
      return { ok: true };
    },
    async handleAuthCallback(callbackUrl) {
      const code = new URL(callbackUrl).searchParams.get('code');
      if (!code) return { ok: false };
      const { data, error } = await requireClient().auth.exchangeCodeForSession(code);
      if (error) throw error;
      currentSession = data.session;
      return { ok: true };
    },
    async signOut() {
      const { error } = await requireClient().auth.signOut();
      if (error) throw error;
      currentSession = null;
      return { ok: true };
    },
    async updateProfile(displayName) {
      const activeSession = await session();
      if (!activeSession) throw new Error('Sign in first.');
      const { error } = await requireClient().from('profiles').update({ display_name: String(displayName || '').trim().slice(0, 32) }).eq('id', activeSession.user.id);
      if (error) throw error;
      return getDashboard();
    },
    async createSquad(name) {
      const { error } = await requireClient().rpc('create_squad', { squad_name: String(name || '').trim().slice(0, 48) });
      if (error) throw error;
      return getDashboard();
    },
    async joinSquad(inviteCode) {
      const { error } = await requireClient().rpc('join_squad', { invite_code_input: String(inviteCode || '').trim().toUpperCase() });
      if (error) throw error;
      return getDashboard();
    },
    async syncDailySummary(summary) {
      const activeSession = await session();
      if (!activeSession) return { ok: false, offline: true };
      const safeSummary = {
        user_id: activeSession.user.id,
        local_date: summary.date,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        focus_minutes: Number(summary.focusMinutes || 0),
        focus_sessions: Number(summary.focusSessions || 0),
        break_minutes: Number(summary.breakMinutes || 0),
        breaks_completed: Number(summary.breaksCompleted || 0),
        bypass_count: Array.isArray(summary.bypasses) ? summary.bypasses.length : Number(summary.bypassCount || 0),
        balance_score: Number(summary.balanceScore || 0),
        updated_at: new Date().toISOString()
      };
      const { error } = await requireClient().from('daily_summaries').upsert(safeSummary);
      if (error) throw error;
      return { ok: true };
    }
  };
}

module.exports = { createEncryptedStorage, createSocialService, readBuildConfig };
