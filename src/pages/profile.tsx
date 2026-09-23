import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { User, Settings, LogOut, Lock, Mail, CheckCircle2, Shield, Heart } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, login, logout, refreshUser, currentVersion, setCurrentVersion, theme, toggleTheme } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preference state
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    }
  };

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

            {/* Reading Preferences */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-500" />
                <span>Reading Preferences</span>
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-stone-500">Default Bible Translation</label>
                <div className="grid grid-cols-2 gap-2">
                  {['KJV', 'WEB', 'MBBTAG12'].map((ver) => (
                    <button
                      key={ver}
                      type="button"
                      onClick={() => handleUpdatePreferences(ver)}
                      className={`p-3 rounded-2xl text-xs font-semibold border transition-all text-left ${currentVersion === ver
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                        }`}
                    >
                      {ver === 'KJV' && 'King James (KJV)'}
                      {ver === 'WEB' && 'World English (WEB)'}
                      {ver === 'MBBTAG12' && 'Tagalog (MBBTAG12)'}
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
          /* Authentication Screen (Login / Register) */
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {authMode === 'login' ? 'Sign In to WithGod' : 'Create Your Account'}
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
        )}
      </div>
    </>
  );
}
