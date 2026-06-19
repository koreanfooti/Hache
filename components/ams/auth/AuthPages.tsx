"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import type { AmsAuthRole } from "@/lib/ams/auth-rules";
import {
  authRoleLabel,
  authRoleOptions,
  demoAuthUsers,
  demoPassword,
} from "@/lib/ams/auth-session";
import { useAuth } from "@/components/ams/auth/AuthProvider";

export function SignInPage() {
  const router = useRouter();
  const { signIn, status } = useAuth();
  const [email, setEmail] = useState("technical@realams.local");
  const [password, setPassword] = useState(demoPassword);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [router, status]);

  async function submitSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      router.replace("/");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Real AMS"
      title="Sign in"
      copy="Choose a staff account to open the correct role-based workspace."
      footer={<span>Need an account? <Link href="/sign-up">Create one</Link></span>}
    >
      <form className="auth-form" onSubmit={submitSignIn}>
        <div className="auth-field">
          <label htmlFor="sign-in-email">Email</label>
          <input id="sign-in-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </div>
        <div className="auth-field">
          <label htmlFor="sign-in-password">Password</label>
          <input id="sign-in-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </div>
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <section className="auth-demo-list">
        <span>Demo accounts</span>
        {demoAuthUsers.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => {
              setEmail(user.email);
              setPassword(demoPassword);
              setError("");
            }}
          >
            <strong>{authRoleLabel(user.role)}</strong>
            <small>{user.email}</small>
          </button>
        ))}
      </section>
    </AuthShell>
  );
}

export function SignUpPage() {
  const router = useRouter();
  const { signUp, status } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AmsAuthRole>("administration");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [router, status]);

  async function submitSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signUp({ name, email, password, role });
      router.replace("/");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Real AMS"
      title="Create account"
      copy="Create a local staff account and assign a rulebook role."
      footer={<span>Already have an account? <Link href="/sign-in">Sign in</Link></span>}
    >
      <form className="auth-form" onSubmit={submitSignUp}>
        <div className="auth-field">
          <label htmlFor="sign-up-name">Name</label>
          <input id="sign-up-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
        </div>
        <div className="auth-field">
          <label htmlFor="sign-up-email">Email</label>
          <input id="sign-up-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </div>
        <div className="auth-field">
          <label htmlFor="sign-up-password">Password</label>
          <input id="sign-up-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
        </div>
        <div className="auth-field">
          <label htmlFor="sign-up-role">Role</label>
          <select id="sign-up-role" value={role} onChange={(event) => setRole(event.target.value as AmsAuthRole)}>
            {authRoleOptions.map((option) => (
              <option key={option.role} value={option.role}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p className="auth-role-help">{authRoleOptions.find((option) => option.role === role)?.description}</p>
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  children,
  copy,
  eyebrow,
  footer,
  title,
}: {
  children: React.ReactNode;
  copy: string;
  eyebrow: string;
  footer: React.ReactNode;
  title: string;
}) {
  return (
    <main className="route-fallback auth-page">
      <section className="route-fallback-panel auth-card">
        <div className="auth-card-heading">
          <span className="section-kicker">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{copy}</p>
        </div>
        {children}
        <footer>{footer}</footer>
      </section>
    </main>
  );
}
