import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { User, Settings, LogOut, Lock, Mail, CheckCircle2, Shield, Eye, EyeOff, Zap, Loader2, Key, Type, BookOpen } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useApp, SystemFontSize, SystemFontFamily } from '../context/AppContext';
import { api } from '../services/api';

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    login,
    logout,
    refreshUser,
    currentVersion,
    setCurrentVersion,
    theme,
    toggleTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    geminiApiKey,
    setGeminiApiKey,
  } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preference state
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Gemini API Key state
  const [geminiKeyInput, setGeminiKeyInput] = useState(geminiApiKey || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [keyTestError, setKeyTestError] = useState('');

  // Sync if geminiApiKey loaded from storage after mount
  useEffect(() => {
    if (geminiApiKey && !geminiKeyInput) {
      setGeminiKeyInput(geminiApiKey);
    }
  }, [geminiApiKey]);

  const handleSaveGeminiKey = async () => {
    setIsSavingKey(true);
    try {
      const trimmed = geminiKeyInput.trim();
      setGeminiApiKey(trimmed);
      if (user?.is_staff || user?.is_superuser) {
        await api.saveSystemSettings({ gemini_api_key: trimmed });
      }
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 3000);
    } catch (e: any) {
      console.error('Failed to save system settings:', e);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleTestGeminiKey = async () => {
    const keyToTest = geminiKeyInput.trim() || geminiApiKey;
    if (!keyToTest) return;
    setIsTestingKey(true);
    setKeyTestStatus('idle');
    setKeyTestError('');
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${keyToTest}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with OK.' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || res.statusText);
      }
      setKeyTestStatus('valid');
    } catch (err: any) {
      setKeyTestStatus('invalid');
      setKeyTestError(err.message || 'Verification failed');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        const res = await api.login({ email, password });
        login(res.tokens, res.user);
      } else {
        const res = await api.register({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        });
        login(res.tokens, res.user);
      }
      router.push('/');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillAdminDemo = () => {
    setEmail('admin@test.com');
    setPassword('adminpassword');
    setAuthMode('login');
  };

  const handleUpdatePreferences = async (preferredVer: string) => {
    setCurrentVersion(preferredVer);
    if (user) {
      try {
        await api.updatePreferences({ preferred_translation: preferredVer });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleUpdateFontSize = (size: SystemFontSize) => {
    setFontSize(size);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleUpdateFontFamily = (family: SystemFontFamily) => {
    setFontFamily(family);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const renderReadingPreferencesCard = () => (
    <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Type className="w-4 h-4 text-amber-500" />
          <span>Reading & Typography Preferences</span>
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          SYSTEM-WIDE
        </span>
      </div>

      {/* Font Size Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            System Font Size
          </label>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
            {fontSize === 'small' && '14px • Compact'}
            {fontSize === 'medium' && '16px • Normal (Default)'}
            {fontSize === 'large' && '18px • Comfortable'}
            {fontSize === 'xlarge' && '20px • Extra Large (Easy Read)'}
          </span>
        </div>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
          Adjusts the text size across the whole system (Bible reader, Torah, Chat, Devotions, and navigation) for effortless reading.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'small', label: 'Compact', size: '14px', sampleClass: 'text-xs' },
            { id: 'medium', label: 'Default', size: '16px', sampleClass: 'text-sm' },
            { id: 'large', label: 'Large', size: '18px', sampleClass: 'text-base font-bold' },
            { id: 'xlarge', label: 'Extra Large', size: '20px', sampleClass: 'text-lg font-bold' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleUpdateFontSize(item.id as SystemFontSize)}
              className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between h-20 ${
                fontSize === item.id
                  ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-xs'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 hover:border-amber-300 dark:hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`font-semibold ${item.sampleClass}`}>Aa</span>
                {fontSize === item.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <span className="text-xs font-semibold block leading-tight">{item.label}</span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 block">{item.size}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Family Selector */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
          Typeface Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              id: 'sans',
              title: 'Modern Sans',
              subtitle: 'Inter • Clean UI & modern clarity',
              className: 'font-sans',
            },
            {
              id: 'serif',
              title: 'Scripture Serif',
              subtitle: 'Lora • Classic book & Bible reading',
              className: 'font-serif italic',
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleUpdateFontFamily(item.id as SystemFontFamily)}
              className={`p-3 rounded-2xl border transition-all text-left ${
                fontFamily === item.id
                  ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-xs'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 hover:border-amber-300 dark:hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${item.className}`}>{item.title}</span>
                {fontFamily === item.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block mt-0.5 leading-snug">
                {item.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Reading Preview Box */}
      <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/15 space-y-2 transition-all">
        <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 dark:text-amber-300">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Live Typography Preview</span>
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">
            {fontSize.toUpperCase()} • {fontFamily === 'serif' ? 'LORA SERIF' : 'INTER SANS'}
          </span>
        </div>
        <blockquote className="text-stone-800 dark:text-stone-200 leading-relaxed italic border-l-2 border-amber-500 pl-3">
          "Your word is a lamp to my feet and a light to my path."
        </blockquote>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 pl-3">
          Psalm 119:105 (WEB) • Ang salita mo'y tanglaw sa aking mga paa, at liwanag sa aking landas.
        </p>
      </div>

      {/* Default Bible Translation */}
      <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
          Default Bible Translation
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'KJV', name: 'King James (KJV)' },
            { id: 'WEB', name: 'World English (WEB)' },
            { id: 'MBBTAG12', name: 'Tagalog (MBBTAG12)' },
          ].map((ver) => (
            <button
              key={ver.id}
              type="button"
              onClick={() => handleUpdatePreferences(ver.id)}
              className={`p-3 rounded-2xl text-xs font-semibold border transition-all text-left ${
                currentVersion === ver.id
                  ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 hover:border-amber-300'
              }`}
            >
              <span className="block truncate">{ver.name}</span>
            </button>
          ))}
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Preferences saved successfully!</span>
        </div>
      )}
    </div>
  );

  const renderGeminiKeyCard = () => (
    <div className={`p-6 rounded-3xl bg-white dark:bg-stone-900 border shadow-sm space-y-4 transition-colors ${
      geminiApiKey ? 'border-amber-300 dark:border-amber-800' : 'border-stone-200/80 dark:border-stone-800'
    }`}>
      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
        <Key className="w-4 h-4 text-amber-500" />
        <span>Gemini AI API Key</span>
        {geminiApiKey && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">CONFIGURED</span>
        )}
      </h3>
      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
        Enter your personal Gemini API key to enable the AI Bible assistant. The key is stored locally in your browser.
        Get a free key at{' '}
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 underline underline-offset-2">aistudio.google.com</a>.
      </p>

      {/* Key input */}
      <div className="relative">
        <input
          id="gemini-api-key-input"
          type={showGeminiKey ? 'text' : 'password'}
          value={geminiKeyInput}
          onChange={(e) => setGeminiKeyInput(e.target.value)}
          placeholder="AIza..."
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-3 pr-10 py-2.5 rounded-2xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 font-mono"
        />
        <button
          type="button"
          onClick={() => setShowGeminiKey(!showGeminiKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          aria-label={showGeminiKey ? 'Hide API key' : 'Show API key'}
        >
          {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Status */}
      {keyTestStatus === 'valid' && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Gemini API key is verified and operational!</span>
        </div>
      )}
      {keyTestStatus === 'invalid' && (
        <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          ✕ Invalid key: {keyTestError}
        </div>
      )}
      {keySaved && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>API key saved successfully!</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          id="test-gemini-key-btn"
          type="button"
          onClick={handleTestGeminiKey}
          disabled={isTestingKey || !geminiKeyInput.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 transition-colors"
        >
          {isTestingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {isTestingKey ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          id="save-gemini-key-btn"
          type="button"
          onClick={handleSaveGeminiKey}
          disabled={isSavingKey || !geminiKeyInput.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
        >
          {isSavingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Save Key
        </button>
        {geminiApiKey && (
          <button
            type="button"
            onClick={async () => {
              setGeminiApiKey('');
              setGeminiKeyInput('');
              setKeyTestStatus('idle');
              if (user?.is_staff || user?.is_superuser) {
                await api.saveSystemSettings({ gemini_api_key: '' }).catch(() => {});
              }
            }}
            className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <PageLayout title="Account & Settings" items={[{ label: 'Profile' }]} />

      <div className="max-w-xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {user ? (
          /* User Profile & Preferences View */
          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-amber-500/20">
                {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate">{user.full_name}</h2>
                  {user.is_staff && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 truncate">{user.email}</p>
              </div>
            </div>

            {/* Reading & Typography Preferences Card */}
            {renderReadingPreferencesCard()}

            {/* Gemini AI API Key Card */}
            {renderGeminiKeyCard()}

            {/* Admin Portal Link if staff */}
            {user.is_staff && (
              <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                    <Shield className="w-4 h-4" />
                    <span>Administrator Controls</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/admin')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                  >
                    Go to Admin Portal
                  </button>
                </div>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                  Manage Verse of the Day, community gatherings, and study insights.
                </p>
              </div>
            )}

            {/* Logout button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={logout}
                className="w-full py-3 px-4 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center space-x-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Screen (Login / Register) + Guest Gemini Key Access */
          <div className="space-y-6">
            <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {authMode === 'login' ? 'Sign In to Shema' : 'Create Your Account'}
                </h2>
                <p className="text-xs text-stone-500">
                  Access your personal devotions, highlights, and notes across all your devices.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${authMode === 'login' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                    }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${authMode === 'register' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                    }`}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-500 block mb-1">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 block mb-1">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-stone-500 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-500 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              </form>

              {/* Quick Demo Credentials Assistant */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 text-center">
                <button
                  type="button"
                  onClick={handleFillAdminDemo}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Use default Admin credentials (admin@test.com)
                </button>
              </div>
            </div>

            {/* Guest Reading & Typography Preferences Card */}
            {renderReadingPreferencesCard()}

            {/* Guest Gemini AI API Key Card */}
            {renderGeminiKeyCard()}
          </div>
        )}
      </div>
    </>
  );
}
