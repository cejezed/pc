import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { LogIn, UserPlus, Lock, Mail } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, { full_name: fullName });
      }
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--zeus-bg)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--zeus-primary)]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--zeus-accent)]/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--zeus-text)] mb-2 zeus-glow-text">Brikx</h1>
          <p className="text-[var(--zeus-text-secondary)]">Jouw persoonlijke productiviteitsplatform</p>
        </div>

        {/* Auth Card */}
        <div className="bg-[var(--zeus-card)] rounded-2xl shadow-2xl p-8 border border-[var(--zeus-border)] backdrop-blur-md">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${mode === 'login'
                  ? 'bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]'
                  : 'bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] hover:bg-[var(--zeus-card-hover)]'
                }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Inloggen
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${mode === 'register'
                  ? 'bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]'
                  : 'bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] hover:bg-[var(--zeus-card-hover)]'
                }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Registreren
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                  Volledige Naam
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-xl px-4 py-3 text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all placeholder-[var(--zeus-text-secondary)]/50"
                  placeholder="Jan de Vries"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-[var(--zeus-text-secondary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-xl pl-12 pr-4 py-3 text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all placeholder-[var(--zeus-text-secondary)]/50"
                  placeholder="jouw@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                Wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-[var(--zeus-text-secondary)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-xl pl-12 pr-4 py-3 text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all placeholder-[var(--zeus-text-secondary)]/50"
                  placeholder="••••••••"
                />
              </div>
              {mode === 'register' && (
                <p className="text-xs text-[var(--zeus-text-secondary)] mt-1">Minimaal 6 karakters</p>
              )}
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full btn-zeus-primary py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {mode === 'login' ? 'Inloggen...' : 'Registreren...'}
                </span>
              ) : mode === 'login' ? (
                'Inloggen'
              ) : (
                'Account Aanmaken'
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-[var(--zeus-text-secondary)]">
            {mode === 'login' ? (
              <>
                Nog geen account?{' '}
                <button
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="text-[var(--zeus-primary)] font-semibold hover:underline hover:text-[var(--zeus-primary)]/80"
                >
                  Registreer hier
                </button>
              </>
            ) : (
              <>
                Al een account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="text-[var(--zeus-primary)] font-semibold hover:underline hover:text-[var(--zeus-primary)]/80"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}