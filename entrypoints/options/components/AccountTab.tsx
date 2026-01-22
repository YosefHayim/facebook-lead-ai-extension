import { LogOut, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { UserSubscription } from '../../../src/types';

interface AccountTabProps {
  user: User | null;
  subscription: UserSubscription | null;
  leadsCount: number;
  email: string;
  setEmail: (e: string) => void;
  password: string;
  setPassword: (p: string) => void;
  authError: string | null;
  authLoading: boolean;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
  onAuth: () => void;
  onGoogleAuth: () => void;
  onSignOut: () => void;
  onSyncToCloud: () => void;
}

export function AccountTab({
  user, subscription, leadsCount, email, setEmail, password, setPassword,
  authError, authLoading, isSignUp, setIsSignUp, onAuth, onGoogleAuth, onSignOut, onSyncToCloud,
}: AccountTabProps) {
  if (user) {
    return <LoggedInView user={user} subscription={subscription} leadsCount={leadsCount} onSignOut={onSignOut} onSyncToCloud={onSyncToCloud} />;
  }
  return (
    <AuthForm
      email={email} setEmail={setEmail} password={password} setPassword={setPassword}
      authError={authError} authLoading={authLoading} isSignUp={isSignUp} setIsSignUp={setIsSignUp}
      onAuth={onAuth} onGoogleAuth={onGoogleAuth}
    />
  );
}

interface LoggedInViewProps {
  user: User;
  subscription: UserSubscription | null;
  leadsCount: number;
  onSignOut: () => void;
  onSyncToCloud: () => void;
}

function LoggedInView({ user, subscription, leadsCount, onSignOut, onSyncToCloud }: LoggedInViewProps) {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Account</h2>
          <button onClick={onSignOut} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">{user.email?.[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.email}</p>
            <p className="text-sm text-gray-500 capitalize">{subscription?.plan || 'Free'} Plan</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Cloud Sync</h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Cloud className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Sync Data to Cloud</p>
              <p className="text-xs text-gray-500">{leadsCount} leads stored locally</p>
            </div>
          </div>
          <button onClick={onSyncToCloud} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Sync Now
          </button>
        </div>
      </section>

      {subscription?.plan === 'free' && (
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h2 className="text-lg font-medium mb-2">Upgrade to Pro</h2>
          <p className="text-blue-100 text-sm mb-4">Get unlimited leads, advanced AI features, and priority support.</p>
          <button className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50">View Plans</button>
        </section>
      )}
    </div>
  );
}

interface AuthFormProps {
  email: string;
  setEmail: (e: string) => void;
  password: string;
  setPassword: (p: string) => void;
  authError: string | null;
  authLoading: boolean;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
  onAuth: () => void;
  onGoogleAuth: () => void;
}

function AuthForm({ email, setEmail, password, setPassword, authError, authLoading, isSignUp, setIsSignUp, onAuth, onGoogleAuth }: AuthFormProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <CloudOff className="w-6 h-6 text-gray-400" />
        <div>
          <h2 className="text-lg font-medium text-gray-900">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <p className="text-sm text-gray-500">Sync your leads across devices</p>
        </div>
      </div>

      {authError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">
          <AlertCircle className="w-4 h-4" />
          {authError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            placeholder="••••••••"
          />
        </div>
        <button
          onClick={onAuth}
          disabled={authLoading}
          className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {authLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
        <GoogleButton onClick={onGoogleAuth} disabled={authLoading} />
        <p className="text-center text-sm text-gray-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 hover:underline">
            {isSignUp ? 'Sign In' : 'Create one'}
          </button>
        </p>
      </div>
    </section>
  );
}

function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continue with Google
    </button>
  );
}
