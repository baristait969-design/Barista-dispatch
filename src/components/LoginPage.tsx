import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  AlertCircle,
  ThermometerSnowflake,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithEmail } = useAuth();
  
  // Set default credentials as requested: baristait969@gmail.com with password 123
  const [email, setEmail] = useState('baristait969@gmail.com');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err?.message || 'Authentication failed. Please verify credentials or contact the Administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillAdmin = () => {
    setEmail('baristait969@gmail.com');
    setPassword('123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand header */}
      <div className="text-center mb-6 z-10">
        <div className="inline-flex items-center justify-center space-x-2 bg-stone-900 border border-stone-800 px-4 py-1.5 rounded-full mb-3 text-xs text-amber-300">
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

      {/* Clean focused Login Card */}
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 backdrop-blur-md">
        <div className="mb-5 text-center">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Staff Portal Sign In
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Central Kitchen Dispatch, Inventory & Quality Control
          </p>
        </div>

        {/* Administrator credentials info pill */}
        <div className="mb-5 p-3.5 bg-stone-850 border border-amber-900/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>Administrator Account</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                  Full Access
                </span>
              </div>
              <div className="text-[11px] text-stone-400 font-mono">
                baristait969@gmail.com
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillAdmin}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline px-2 py-1 rounded hover:bg-stone-800 transition cursor-pointer"
          >
            Autofill
          </button>
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
                placeholder="baristait969@gmail.com"
                className="w-full pl-9 pr-3 py-2 bg-stone-850 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-stone-300">
                Password
              </label>
              <span className="text-[11px] text-stone-500">
                Default: <code className="text-amber-400 font-mono">123</code>
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-2 bg-stone-850 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-lg shadow-md transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
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

        <div className="mt-5 pt-4 border-t border-stone-800/80 text-center text-xs text-stone-400">
          <div className="flex items-center justify-center space-x-1.5 text-stone-400">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff accounts and passwords are managed by the Administrator</span>
          </div>
        </div>
      </div>

      {/* Footer details */}
      <div className="text-center mt-6 text-stone-500 text-xs">
        <p>HACCP Quality Assurance System • Barista Coffee Lanka (Pvt) Ltd</p>
      </div>
    </div>
  );
};
