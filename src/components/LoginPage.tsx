import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Coffee, 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  ThermometerSnowflake,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loginWithEmail, loginDemoRole } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Authentication failed. Please verify credentials or contact your Administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand header */}
      <div className="text-center mb-6 z-10">
        <div className="inline-flex items-center justify-center space-x-2 bg-stone-800/80 border border-stone-700/70 px-4 py-1.5 rounded-full mb-3 text-xs text-amber-300">
          <ThermometerSnowflake className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>HACCP BCL/REC/HACCP/32 Compliance System</span>
        </div>
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-serif font-black text-2xl shadow-lg shadow-amber-900/30">
            B
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-widest text-white">
              BARISTA
            </h1>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              Sri Lanka — Central Kitchen Dispatch & Inventory
            </p>
          </div>
        </div>
      </div>

      {/* Centered Login Card - Clean Single Sign-In matching user's exact specification */}
      <div className="w-full max-w-md bg-stone-850 bg-stone-900/95 border border-stone-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 backdrop-blur-md">
        <div className="mb-5 text-center">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Staff Portal Sign In
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Access authorized central kitchen modules and dispatch logs
          </p>
        </div>

        {/* Notice: Creating account is strictly in Users module by Admin */}
        <div className="mb-4 p-3 bg-amber-950/40 border border-amber-800/50 rounded-lg text-amber-200 text-xs flex items-start space-x-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong>Restricted Access:</strong> Staff accounts and role assignments are provisioned exclusively by the <strong>System Administrator</strong> via the internal Users module.
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@barista.lk"
                className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-lg shadow-md transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Central Kitchen</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center">
          <div className="flex-1 border-t border-stone-800"></div>
          <span className="px-3 text-stone-500 text-xs uppercase font-mono">or continue with</span>
          <div className="flex-1 border-t border-stone-800"></div>
        </div>

        {/* Google Sign In via Firebase */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2 px-4 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-medium rounded-lg text-sm transition flex items-center justify-center space-x-3 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Sign In with Firebase Google Auth</span>
        </button>

        {/* University Project Demo Roles Selector */}
        <div className="mt-6 pt-5 border-t border-stone-800">
          <div className="flex items-center space-x-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider">
              Project Demonstration Quick Login
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mb-3 leading-relaxed">
            Select a verified staff role to evaluate the system's access controls and module restrictions:
          </p>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => loginDemoRole('admin')}
              className="w-full text-left p-2.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-amber-600/40 hover:border-amber-500 transition text-xs flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-amber-300 group-hover:text-amber-200">
                  Admin (QA Executive)
                </div>
                <div className="text-[10px] text-stone-400">
                  Has exclusive authority to create users, assign roles, & manage permissions
                </div>
              </div>
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-mono rounded">
                Admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => loginDemoRole('editor')}
              className="w-full text-left p-2.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-blue-600/40 hover:border-blue-500 transition text-xs flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-blue-300 group-hover:text-blue-200">
                  Editor (Head Pastry Chef / Supervisor)
                </div>
                <div className="text-[10px] text-stone-400">
                  Inventory & Dispatch forms access only (cannot create users)
                </div>
              </div>
              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-mono rounded">
                Editor
              </span>
            </button>

            <button
              type="button"
              onClick={() => loginDemoRole('viewer')}
              className="w-full text-left p-2.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-emerald-600/40 hover:border-emerald-500 transition text-xs flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-emerald-300 group-hover:text-emerald-200">
                  Viewer (Store Auditor / Inspector)
                </div>
                <div className="text-[10px] text-stone-400">
                  Read-only view: Cannot create users or edit inventory
                </div>
              </div>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded">
                Viewer
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer details */}
      <div className="text-center mt-6 text-stone-500 text-xs">
        <p>HACCP Quality Assurance System • Barista Coffee Lanka (Pvt) Ltd</p>
        <p className="text-[11px] text-stone-600 mt-0.5">Built for University Project Demonstration</p>
      </div>
    </div>
  );
};
