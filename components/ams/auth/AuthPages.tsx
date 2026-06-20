"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import type { AmsAuthRole } from "@/lib/ams/auth-rules";
import {
  authRoleOptions,
  demoAuthUsers,
  demoPassword,
} from "@/lib/ams/auth-session";
import { authCopy, localizedAuthError, localizedAuthRoleLabel } from "@/components/ams/auth/auth-copy";
import { useAuth } from "@/components/ams/auth/AuthProvider";
import { useAmsLanguage } from "@/components/ams/hooks/useAmsLanguage";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

export function SignInPage() {
  const router = useRouter();
  const { signIn, status } = useAuth();
  const [language, setLanguage] = useAmsLanguage();
  const copy = authCopy[language].signIn;
  const commonCopy = authCopy[language].common;
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
      copy={copy.copy}
      eyebrow={commonCopy.appName}
      footer={<span>{copy.footerPrefix} <Link href="/sign-up">{copy.footerLink}</Link></span>}
      language={language}
      title={copy.title}
      onLanguageChange={setLanguage}
    >
      <form className="auth-form" onSubmit={submitSignIn}>
        <div className="auth-field">
          <label htmlFor="sign-in-email">{copy.fields.email}</label>
          <input id="sign-in-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </div>
        <div className="auth-field">
          <label htmlFor="sign-in-password">{copy.fields.password}</label>
          <input id="sign-in-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </div>
        {error ? <p className="auth-error">{localizedAuthError(error, language)}</p> : null}
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? copy.buttons.submitting : copy.buttons.idle}
        </button>
      </form>
      <section className="auth-demo-list">
        <span>{commonCopy.demoAccounts}</span>
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
            <strong>{localizedAuthRoleLabel(user.role, language)}</strong>
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
  const [language, setLanguage] = useAmsLanguage();
  const copy = authCopy[language].signUp;
  const commonCopy = authCopy[language].common;
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
      copy={copy.copy}
      eyebrow={commonCopy.appName}
      footer={<span>{copy.footerPrefix} <Link href="/sign-in">{copy.footerLink}</Link></span>}
      language={language}
      title={copy.title}
      onLanguageChange={setLanguage}
    >
      <form className="auth-form" onSubmit={submitSignUp}>
        <div className="auth-field">
          <label htmlFor="sign-up-name">{copy.fields.name}</label>
          <input id="sign-up-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
        </div>
        <div className="auth-field">
          <label htmlFor="sign-up-email">{copy.fields.email}</label>
          <input id="sign-up-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </div>
        <div className="auth-field">
          <label htmlFor="sign-up-password">{copy.fields.password}</label>
          <input id="sign-up-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
        </div>
        <div className="auth-field">
          <label htmlFor="sign-up-role">{copy.fields.role}</label>
          <select id="sign-up-role" value={role} onChange={(event) => setRole(event.target.value as AmsAuthRole)}>
            {authRoleOptions.map((option) => (
              <option key={option.role} value={option.role}>
                {localizedAuthRoleLabel(option.role, language)}
              </option>
            ))}
          </select>
        </div>
        <p className="auth-role-help">{commonCopy.roles[role]?.description}</p>
        {error ? <p className="auth-error">{localizedAuthError(error, language)}</p> : null}
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? copy.buttons.submitting : copy.buttons.idle}
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
  language,
  onLanguageChange,
  title,
}: {
  children: ReactNode;
  copy: string;
  eyebrow: string;
  footer: ReactNode;
  language: AmsLanguage;
  onLanguageChange: (language: AmsLanguage) => void;
  title: string;
}) {
  const commonCopy = authCopy[language].common;

  return (
    <main className="route-fallback auth-page">
      <section className="route-fallback-panel auth-card">
        <div className="auth-card-heading">
          <div className="auth-heading-bar">
            <span className="section-kicker">{eyebrow}</span>
            <span className="auth-language-action" aria-label={commonCopy.language}>
              <button
                className={language === "en" ? "is-active" : ""}
                type="button"
                onClick={() => onLanguageChange("en")}
                aria-label={commonCopy.switchToEnglish}
              >
                🇬🇧
              </button>
              <button
                className={language === "es" ? "is-active" : ""}
                type="button"
                onClick={() => onLanguageChange("es")}
                aria-label={commonCopy.switchToSpanish}
              >
                🇲🇽
              </button>
            </span>
          </div>
          <h1>{title}</h1>
          <p>{copy}</p>
        </div>
        {children}
        <footer>{footer}</footer>
      </section>
    </main>
  );
}
