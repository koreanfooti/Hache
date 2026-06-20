import type { AmsAuthRole } from "@/lib/ams/auth-rules";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

type AuthRoleCopy = {
  label: string;
  description: string;
};

type AuthPageCopy = {
  title: string;
  copy: string;
  footerPrefix: string;
  footerLink: string;
  fields: {
    email: string;
    name?: string;
    password: string;
    role?: string;
  };
  buttons: {
    idle: string;
    submitting: string;
  };
};

type AuthCopy = {
  common: {
    appName: string;
    language: string;
    switchToEnglish: string;
    switchToSpanish: string;
    demoAccounts: string;
    errors: Record<string, string>;
    roles: Record<AmsAuthRole, AuthRoleCopy>;
  };
  signIn: AuthPageCopy;
  signUp: AuthPageCopy;
};

export const authCopy: Record<AmsLanguage, AuthCopy> = {
  en: {
    common: {
      appName: "Real AMS",
      language: "Language",
      switchToEnglish: "Switch to English",
      switchToSpanish: "Switch to Spanish",
      demoAccounts: "Demo accounts",
      errors: {
        "Invalid email or password.": "Invalid email or password.",
        "Enter a name.": "Enter a name.",
        "Enter a valid email address.": "Enter a valid email address.",
        "Use at least 8 characters for the password.": "Use at least 8 characters for the password.",
        "An account already exists for that email.": "An account already exists for that email.",
        "Unable to sign in.": "Unable to sign in.",
        "Unable to create account.": "Unable to create account.",
      },
      roles: {
        administration: {
          label: "Administration",
          description: "Biography, financial biography fields, and player care management.",
        },
        technicalStaff: {
          label: "Technical Staff",
          description: "Full football staff access.",
        },
        medicalPerformanceDirector: {
          label: "Medical and Performance Director",
          description: "Director-level full access.",
        },
        medicalStaff: {
          label: "Medical Staff",
          description: "Medical and care access with financial fields restricted.",
        },
        performanceStaff: {
          label: "Performance Staff",
          description: "Performance and care access with financial fields restricted.",
        },
        medicalPerformanceStaff: {
          label: "Medical and Performance Staff",
          description: "Medical/performance access with financial fields restricted.",
        },
      },
    },
    signIn: {
      title: "Sign in",
      copy: "Choose a staff account to open the correct role-based workspace.",
      footerPrefix: "Need an account?",
      footerLink: "Create one",
      fields: {
        email: "Email",
        password: "Password",
      },
      buttons: {
        idle: "Sign in",
        submitting: "Signing in...",
      },
    },
    signUp: {
      title: "Create account",
      copy: "Create a local staff account and assign a rulebook role.",
      footerPrefix: "Already have an account?",
      footerLink: "Sign in",
      fields: {
        name: "Name",
        email: "Email",
        password: "Password",
        role: "Role",
      },
      buttons: {
        idle: "Create account",
        submitting: "Creating account...",
      },
    },
  },
  es: {
    common: {
      appName: "Real AMS",
      language: "Idioma",
      switchToEnglish: "Cambiar a inglés",
      switchToSpanish: "Cambiar a español",
      demoAccounts: "Cuentas demo",
      errors: {
        "Invalid email or password.": "Correo o contraseña incorrectos.",
        "Enter a name.": "Ingresa un nombre.",
        "Enter a valid email address.": "Ingresa un correo electrónico válido.",
        "Use at least 8 characters for the password.": "Usa al menos 8 caracteres para la contraseña.",
        "An account already exists for that email.": "Ya existe una cuenta con ese correo.",
        "Unable to sign in.": "No se pudo iniciar sesión.",
        "Unable to create account.": "No se pudo crear la cuenta.",
      },
      roles: {
        administration: {
          label: "Administración",
          description: "Biografía, campos financieros de biografía y gestión de atención al jugador.",
        },
        technicalStaff: {
          label: "Cuerpo técnico",
          description: "Acceso completo para el staff de fútbol.",
        },
        medicalPerformanceDirector: {
          label: "Director médico y de rendimiento",
          description: "Acceso completo a nivel directivo.",
        },
        medicalStaff: {
          label: "Staff médico",
          description: "Acceso médico y de atención con campos financieros restringidos.",
        },
        performanceStaff: {
          label: "Staff de rendimiento",
          description: "Acceso a rendimiento y atención con campos financieros restringidos.",
        },
        medicalPerformanceStaff: {
          label: "Staff médico y de rendimiento",
          description: "Acceso médico/rendimiento con campos financieros restringidos.",
        },
      },
    },
    signIn: {
      title: "Iniciar sesión",
      copy: "Elige una cuenta del staff para abrir el espacio de trabajo correcto según el rol.",
      footerPrefix: "¿Necesitas una cuenta?",
      footerLink: "Crear una",
      fields: {
        email: "Correo electrónico",
        password: "Contraseña",
      },
      buttons: {
        idle: "Iniciar sesión",
        submitting: "Iniciando sesión...",
      },
    },
    signUp: {
      title: "Crear cuenta",
      copy: "Crea una cuenta local del staff y asigna un rol del reglamento.",
      footerPrefix: "¿Ya tienes una cuenta?",
      footerLink: "Iniciar sesión",
      fields: {
        name: "Nombre",
        email: "Correo electrónico",
        password: "Contraseña",
        role: "Rol",
      },
      buttons: {
        idle: "Crear cuenta",
        submitting: "Creando cuenta...",
      },
    },
  },
};

export function localizedAuthRoleLabel(role: AmsAuthRole, language: AmsLanguage) {
  return authCopy[language].common.roles[role]?.label ?? role;
}

export function localizedAuthError(message: string, language: AmsLanguage) {
  return authCopy[language].common.errors[message] ?? message;
}
