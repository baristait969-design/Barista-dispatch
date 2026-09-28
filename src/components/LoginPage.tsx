import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalDialogContext';
import { 
  Lock, 
  User, 
  AlertCircle,
  ThermometerSnowflake,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Timer
} from 'lucide-react';
import { BaristaLogo } from './BaristaLogo';

const MAX_ATTEMPTS = 5;

export const LoginPage: React.FC = () => {
  const { loginWithUsername } = useAuth();
  const { showAlert } = useModal();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Check and restore lockout status on load
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('barista_security_failed_attempts') || '0', 10);
    setFailedAttempts(isNaN(attempts) ? 0 : attempts);

    const updateTimer = () => {
      const lockoutUntilStr = localStorage.getItem('barista_security_lockout_until');
      if (lockoutUntilStr) {
        const lockoutUntil = parseInt(lockoutUntilStr, 10);
        const now = Date.now();
        if (!isNaN(lockoutUntil) && now < lockoutUntil) {
          setLockoutRemaining(Math.ceil((lockoutUntil - now) / 1000));
        } else {
          setLockoutRemaining(0);
          localStorage.removeItem('barista_security_lockout_until');
        }
      } else {
        setLockoutRemaining(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) {
      await showAlert(
        `Portal is currently under automated security quarantine for ${lockoutRemaining} more seconds. Please wait for the lockout countdown to expire.`,
        { title: '🔒 Security Quarantine Active', type: 'security' }
      );
      return;
    }

    setError(null);
    setSubmitting(true);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    // 1. Intrusion Vector Pre-Check (SQL Injection / Script Injection / Attack Payload)
    const intrusionPattern = /('|\b)(select|union|insert|drop|alter|delete|update|exec|script|declare|or\s+['"\d]=['"\d])\b|--|\/\*|<\s*script/i;
    if (intrusionPattern.test(cleanUser) || intrusionPattern.test(cleanPass)) {
      setSubmitting(false);
      triggerShake();
      const quarantineUntil = Date.now() + 120000;
      localStorage.setItem('barista_security_lockout_until', quarantineUntil.toString());
      setLockoutRemaining(120);

      await showAlert(
        `CRITICAL SECURITY ALERT: An unauthorized cyber intrusion / SQL injection attack was detected.\n\nPayload has been intercepted and quarantined. Sign-in has been locked for 120 seconds, and the incident details have been logged for administrative audit.`,
        { title: '🚨 Intrusion Attack Intercepted', type: 'security' }
      );
      return;
    }

    try {
      await loginWithUsername(cleanUser, cleanPass);
      // Reset attempts on successful sign-in
      setFailedAttempts(0);
      localStorage.removeItem('barista_security_failed_attempts');
      localStorage.removeItem('barista_security_lockout_until');
    } catch (err: any) {
      console.error(err);
      triggerShake();
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('barista_security_failed_attempts', newAttempts.toString());

      const errorMessage = err?.message || 'Authentication failed. Please verify credentials.';
      setError(errorMessage);

      if (newAttempts >= MAX_ATTEMPTS) {
        // Enforce 60-second lockout
        const lockUntil = Date.now() + 60000;
        localStorage.setItem('barista_security_lockout_until', lockUntil.toString());
        setLockoutRemaining(60);

        await showAlert(
          `AUTOMATED SECURITY LOCKOUT: 5 consecutive invalid sign-in attempts detected.\n\nTo prevent automated credential-stuffing and hacker brute-force activities, access to the portal has been temporarily locked for 60 seconds.\n\nIf you have forgotten your password, contact your QA System Administrator.`,
          { title: '🛡️ Brute-Force Defense Triggered', type: 'security' }
        );
      } else if (newAttempts >= 3) {
        // Warning modal dialog when 3 or 4 attempts used
        const remaining = MAX_ATTEMPTS - newAttempts;
        await showAlert(
          `SECURITY WARNING: Incorrect username or password entered.\n\nYou have ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before automated security quarantine locks this terminal.\n\nAll unauthorized access attempts are monitored and recorded under Barista IT Policy.`,
          { title: '⚠️ Multiple Failed Attempts Warning', type: 'warning' }
        );
      } else {
        // Standard security alert modal on 1st or 2nd invalid attempt
        await showAlert(
          `Authentication failed: ${errorMessage}\n\nPlease verify your staff username and case-sensitive password. (Attempt ${newAttempts} of ${MAX_ATTEMPTS})`,
          { title: 'Authentication Security Alert', type: 'security' }
        );
      }
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
      <div className={`w-full max-w-md bg-[#171311] border border-[#2E221E] rounded-3xl shadow-2xl p-6 sm:p-8 z-10 backdrop-blur-md transition-all duration-300 ${
        isShaking ? 'animate-bounce ring-2 ring-red-500/80 shadow-red-950/50' : ''
      }`}>
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Staff Portal Sign In
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Sign in with your staff username and password
          </p>
        </div>

        {/* Lockout Active Banner */}
        {lockoutRemaining > 0 && (
          <div className="mb-5 p-4 bg-red-950/90 border border-red-700 rounded-2xl text-red-100 text-xs shadow-xl animate-pulse">
            <div className="flex items-center space-x-2 font-bold text-red-200 mb-1">
              <Timer className="w-4 h-4 text-red-400" />
              <span>SECURITY QUARANTINE ENGAGED</span>
            </div>
            <p className="text-[11px] text-red-300">
              Sign-in is temporarily frozen to prevent automated password hacking attempts.
            </p>
            <div className="mt-2.5 flex items-center justify-between bg-black/40 p-2 rounded-xl border border-red-900/60 font-mono text-xs">
              <span>Time Remaining:</span>
              <span className="text-red-400 font-extrabold text-sm">{lockoutRemaining} seconds</span>
            </div>
          </div>
        )}

        {/* Failed Attempt Warning Counter */}
        {failedAttempts > 0 && lockoutRemaining === 0 && (
          <div className="mb-4 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Failed Attempts: <strong>{failedAttempts} / {MAX_ATTEMPTS}</strong></span>
            </div>
            <span className="text-[10px] text-amber-300/80 font-mono">
              {MAX_ATTEMPTS - failedAttempts} left
            </span>
          </div>
        )}

        {error && lockoutRemaining === 0 && (
          <div className="mb-5 p-3.5 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start space-x-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <div className="relative">
              <User className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                disabled={lockoutRemaining > 0 || submitting}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Username"
                aria-label="Username"
                className="w-full pl-9 pr-3 py-2.5 bg-[#1C1614] border border-[#382B25] rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#ED5338] focus:ring-1 focus:ring-[#ED5338] font-mono transition disabled:opacity-40"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={lockoutRemaining > 0 || submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Password"
                aria-label="Password"
                className="w-full pl-9 pr-10 py-2.5 bg-[#1C1614] border border-[#382B25] rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#ED5338] focus:ring-1 focus:ring-[#ED5338] font-mono transition disabled:opacity-40"
              />
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-200 cursor-pointer disabled:opacity-40"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || lockoutRemaining > 0}
            className="w-full py-3 px-4 bg-[#ED5338] hover:bg-[#D84228] text-white font-bold rounded-xl shadow-lg shadow-[#ED5338]/25 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 mt-3"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : lockoutRemaining > 0 ? (
              <span>Locked ({lockoutRemaining}s)</span>
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
