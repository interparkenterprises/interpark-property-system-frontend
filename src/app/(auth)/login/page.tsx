'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { resolveLandingRoute } from '@/types';
import { Loader2 } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Optional deep-link support: /login?redirect=/some/path
  // AuthContext.login() reads `redirectAfterLogin` from sessionStorage,
  // so we persist the query param there before calling login().
  const redirectParam = searchParams.get('redirect');

  // ── Safety net only ─────────────────────────────────────────────
  // AuthContext.login() is the authoritative navigator: it pushes
  // portal users to /landlord|tenant|service-provider/dashboard,
  // staff to /dashboard, and honours a safe stored redirect.
  //
  // This effect ONLY handles the "already authenticated when /login
  // is visited" case (e.g. a bookmarked /login, or a back-navigation
  // after login). It must never fire while a submit is in flight —
  // otherwise it would `router.replace('/dashboard')` and steal the
  // navigation from login() for portal users. It also uses the same
  // resolveLandingRoute() so it can never disagree with the context.
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (isSubmitting) return;

    const stored = sessionStorage.getItem('redirectAfterLogin');
    if (stored) {
      const portalKind = user.portal?.portal;
      const portalPrefix = portalKind ? `/${portalKind.toLowerCase()}` : null;
      const safe =
        stored !== '/login' &&
        stored !== '/unauthorized' &&
        (!portalPrefix || stored.startsWith(portalPrefix));

      if (safe) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.replace(stored);
        return;
      }
      // Unsafe for this user's portal — drop it and fall through.
      sessionStorage.removeItem('redirectAfterLogin');
    }

    router.replace(resolveLandingRoute(user));
  }, [isLoading, isAuthenticated, user, isSubmitting, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (redirectParam) {
        sessionStorage.setItem('redirectAfterLogin', redirectParam);
      }

      // AuthContext.login() owns ALL routing:
      //  - requiresPasswordChange  -> /change-password
      //  - portal users            -> /landlord|tenant|service-provider/dashboard
      //  - staff                   -> /dashboard (or a safe stored redirect)
      // Do NOT push here — doing so would bypass portal routing.
      await login(email, password);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to sign in. Please check your credentials and try again.';
      setError(message);
      setIsSubmitting(false);
    }
    // On success the component unmounts via router navigation, so we
    // intentionally do NOT setIsSubmitting(false) — the button stays
    // in its loading state until the redirect happens.
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-linear-to-br from-[#005478] to-[#1C2B3A]">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative bg-linear-to-br from-[#005478] to-[#1C2B3A]">
      {/* Soft overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="max-w-md w-full space-y-8 relative z-10 bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-white/20">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white drop-shadow-md">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-200">
            Sign in to your Interpark account
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <input
            id="email"
            type="email"
            placeholder="Email Address"
            required
            autoComplete="email"
            className="w-full rounded-lg px-4 py-2 bg-white/90 border border-gray-300
                      text-gray-900 shadow-sm focus:outline-none focus:ring-2
                      focus:ring-[#00A8C6] focus:border-[#00A8C6]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />

          {/* Password field with eye icon */}
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg px-4 py-2 pr-10 bg-white/90 border border-gray-300
                        text-gray-900 shadow-sm focus:outline-none focus:ring-2
                        focus:ring-[#00A8C6] focus:border-[#00A8C6]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500
                        hover:text-gray-700 focus:outline-none cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-white! hover:text-white/80 transition-colors"
              tabIndex={isSubmitting ? -1 : 0}
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center font-medium">{error}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className={`group relative w-full flex justify-center py-3 px-4 text-sm font-semibold
                      rounded-lg transition-all duration-300 shadow-lg
                      text-white bg-[#00A8C6] hover:bg-[#E6F8FA] hover:text-[#005478]
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A8C6]
                      disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <div className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-300"></span>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center">
            <Link href="/register" className="text-sm font-semibold text-white! hover:text-white/80 transition-colors">
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </form>

        {/* Powered by MasterKimaru */}
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-white/50 text-xs tracking-wider">
            Powered by <span className="text-white/70 font-medium">MasterKimaru</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center relative bg-linear-to-br from-[#005478] to-[#1C2B3A]">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}