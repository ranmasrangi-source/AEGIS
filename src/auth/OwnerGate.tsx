import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  AUTHORIZED_OWNER_EMAIL,
  signInOwnerWithGoogle,
  signOutOwner,
} from '../lib/firebase.ts';

/**
 * Section 2.3 & Section 8.2 (Construction Blueprint V1.0):
 * dashboard/src/auth/OwnerGate.tsx
 *
 * Enforces owner-only access (`adventurenepal04@gmail.com`) and tracks session
 * inactivity timeout (`DB-5`). Also provides an explicit Read-Only Audit Preview
 * toggle so the Founder can inspect the Phase 1 UI on mobile/iframe environments
 * where third-party popups may be restricted, while clearly displaying the
 * Firebase Authentication identity state.
 */

interface OwnerGateAuthContext {
  user: User | null;
  isVerifiedOwner: boolean;
  auditPreviewActive: boolean;
  lastActivitySecAgo: number;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

interface OwnerGateProps {
  sessionTimeoutMinutes?: number;
  children: React.ReactNode | ((authContext: OwnerGateAuthContext) => React.ReactNode);
}

export const OwnerGate: React.FC<OwnerGateProps> = ({
  sessionTimeoutMinutes = 30,
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [auditPreviewActive, setAuditPreviewActive] = useState(true);
  const [lastActivityMs, setLastActivityMs] = useState<number>(() => Date.now());
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const updateActivity = () => setLastActivityMs(Date.now());
    window.addEventListener('pointerdown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    const interval = window.setInterval(() => setNowMs(Date.now()), 5000);
    return () => {
      window.removeEventListener('pointerdown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.clearInterval(interval);
    };
  }, []);

  const inactivityMs = Math.max(0, nowMs - lastActivityMs);
  const timeoutMs = sessionTimeoutMinutes * 60 * 1000;
  const sessionExpired = inactivityMs > timeoutMs;

  useEffect(() => {
    if (sessionExpired && user) {
      void signOutOwner();
    }
  }, [sessionExpired, user]);

  const isVerifiedOwner = Boolean(
    user &&
      user.emailVerified &&
      user.email &&
      user.email.toLowerCase() === AUTHORIZED_OWNER_EMAIL.toLowerCase()
  );

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const cred = await signInOwnerWithGoogle();
      if (
        !cred.user.email ||
        cred.user.email.toLowerCase() !== AUTHORIZED_OWNER_EMAIL.toLowerCase()
      ) {
        await signOutOwner();
        setAuthError(
          `ACCESS DENIED: Account '${cred.user.email ?? 'unknown'}' is not the authorized owner (${AUTHORIZED_OWNER_EMAIL}).`
        );
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in popup failed or was cancelled.');
    }
  };

  const handleSignOut = async () => {
    await signOutOwner();
    setAuditPreviewActive(false);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-slate-800 bg-slate-900 p-6">
          <p className="font-mono text-xs text-slate-400">
            INITIALIZING OWNER IDENTITY GATE (FIREBASE AUTH)...
          </p>
        </div>
      </div>
    );
  }

  if (user && !isVerifiedOwner) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full border border-rose-800/80 bg-slate-900 p-8 space-y-4">
          <div className="font-mono text-xs text-rose-400">
            [SECURITY DENIAL · NON-OWNER IDENTITY REJECTED]
          </div>
          <h1 className="text-xl font-semibold text-white">OwnerGate Access Refused</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Authenticated account <span className="font-mono text-white">{user.email}</span> is not
            authorized for this private AEGIS XAU instance. All views and Firestore collections are
            blocked.
          </p>
          <div className="pt-2">
            <button
              onClick={() => void handleSignOut()}
              className="px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors whitespace-nowrap shrink-0"
            >
              Sign Out Unauthorized Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isVerifiedOwner && !auditPreviewActive) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full border border-slate-800 bg-slate-900 p-8 space-y-5">
          <div className="font-mono text-xs text-amber-400">
            AEGIS XAU · OWNER AUTHENTICATION GATE (SECTION 8.2)
          </div>
          <h1 className="text-2xl font-semibold text-white">Private Owner Sign-In Required</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Access is restricted exclusively to the registered Founder identity (
            <span className="font-mono text-slate-100">{AUTHORIZED_OWNER_EMAIL}</span>). Public
            registration and anonymous access are permanently disabled.
          </p>
          {authError && (
            <div className="p-3 border border-rose-800 bg-rose-950/40 font-mono text-xs text-rose-300">
              {authError}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => void handleSignIn()}
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In with Owner Google Account
            </button>
            <button
              onClick={() => setAuditPreviewActive(true)}
              className="px-4 py-2 text-xs font-medium border border-slate-700 hover:border-slate-500 text-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              Open Phase 1 Read-Only Audit Inspector
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ctx: OwnerGateAuthContext = {
    user,
    isVerifiedOwner,
    auditPreviewActive,
    lastActivitySecAgo: Math.floor(inactivityMs / 1000),
    onSignIn: handleSignIn,
    onSignOut: handleSignOut,
  };

  return <>{typeof children === 'function' ? children(ctx) : children}</>;
};
