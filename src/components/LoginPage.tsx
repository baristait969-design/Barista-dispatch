import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  User, 
  AlertCircle,
  ThermometerSnowflake,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { BaristaLogo } from './BaristaLogo';

export const LoginPage: React.FC = () => {
  const { loginWithUsername } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await loginWithUsername(username.trim(), password);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Authentication failed. Please verify credentials or contact the Administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0B0A] text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient accents in Barista warm espresso and flame tones */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#ED5338]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#3E1812]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Brand header with authentic Barista circular logo */}
      <div className="text-center mb-6 z-10">
        <div className="inline-flex items-center justify-center space-x-2 bg-[#1A1412] border border-[#2E221E] px-4 py-1.5 rounded-full mb-4 text-xs text-[#FFA594] shadow-sm">
          <ThermometerSnowflake className="w-4 h-4 text-[#ED5338] animate-pulse" />
          <span>HACCP BCL/REC/HACCP/32 Compliance System</span>
        </div>
        
        <div className="flex items-center justify-center space-x-3.5">
          <BaristaLogo className="w-14 h-14 shadow-xl ring-2 ring-[#ED5338]/40" />
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-widest text-[#ED5338]">
              BARISTA
            </h1>
            <p className="text-xs text-[#FFA594] font-semibold uppercase tracking-wider">
              Sri Lanka — Central Kitchen Dispatch & Inventory
            </p>
          </div>
        </div>
      </div>

      {/* Clean Secure Login Card - Username & Password Based Authentication */}
      <div className="w-full max-w-md bg-[#171311] border border-[#2E221E] rounded-2xl shadow-2xl p-6 sm:p-8 z-10 backdrop-blur-md">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Staff Portal Sign In
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Sign in with your staff username and password
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start space-x-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Staff Username or User ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="e.g. admin or kamal"
                className="w-full pl-9 pr-3 py-2.5 bg-[#1C1614] border border-[#382B25] rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#ED5338] focus:ring-1 focus:ring-[#ED5338] font-mono transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-[#1C1614] border border-[#382B25] rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#ED5338] focus:ring-1 focus:ring-[#ED5338] font-mono transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-200 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-[#ED5338] hover:bg-[#D84228] text-white font-bold rounded-xl shadow-lg shadow-[#ED5338]/25 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-3"
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

        <div className="mt-5 p-3 bg-[#1C1614] border border-[#382B25] rounded-xl text-[11px] text-stone-400 flex items-start space-x-2">
          <KeyRound className="w-4 h-4 text-[#ED5338] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#FFA594]">Temporary Password:</strong> If an administrator provisioned your account with a temporary one-time password, you will be required to set your own permanent password immediately upon login.
          </span>
        </div>

        <div className="mt-6 pt-4 border-t border-[#2E221E] text-center text-xs text-stone-500">
          <div className="flex items-center justify-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#ED5338]" />
            <span>Secure Enterprise Access Control • Barista QA Portal</span>
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
