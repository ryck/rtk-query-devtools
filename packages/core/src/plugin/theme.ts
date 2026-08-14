import type { DerivedQueryStatus } from "../types";

export type ThemeMode = "light" | "dark";

export function resolveThemeMode(theme: "light" | "dark" | undefined): ThemeMode {
  return theme === "light" ? "light" : "dark";
}

interface StatusClasses {
  badge: string;
  icon: string;
  dot: string;
}

export interface RtkQueryDevtoolsClasses {
  root: string;
  surface: string;
  surfaceHover: string;
  surfaceSelected: string;
  border: string;
  borderInput: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDimmed: string;
  accent: string;
  accentBorder: string;
  danger: string;
  dangerBorder: string;
  /** For controls that put the panel into a simulated, not-real state. */
  warning: string;
  warningBorder: string;
  status: Record<DerivedQueryStatus, StatusClasses>;
  polling: string;
  json: { key: string; string: string; number: string; boolean: string; muted: string };
}

const lightClasses: RtkQueryDevtoolsClasses = {
  root: "rtkq:bg-white rtkq:text-neutral-900",
  surface: "rtkq:bg-neutral-50",
  surfaceHover: "rtkq:hover:bg-neutral-100",
  surfaceSelected: "rtkq:bg-indigo-50",
  border: "rtkq:border-neutral-200",
  borderInput: "rtkq:border-neutral-300",
  textPrimary: "rtkq:text-neutral-900",
  textSecondary: "rtkq:text-neutral-600",
  textMuted: "rtkq:text-neutral-400",
  textDimmed: "rtkq:text-neutral-300",
  accent: "rtkq:text-indigo-600",
  accentBorder: "rtkq:border-indigo-300",
  danger: "rtkq:text-red-600",
  dangerBorder: "rtkq:border-red-300",
  warning: "rtkq:text-amber-700",
  warningBorder: "rtkq:border-amber-400",
  status: {
    fetching: {
      badge: "rtkq:bg-blue-50 rtkq:text-blue-700",
      icon: "rtkq:text-blue-500",
      dot: "rtkq:bg-blue-500",
    },
    error: {
      badge: "rtkq:bg-red-50 rtkq:text-red-700",
      icon: "rtkq:text-red-500",
      dot: "rtkq:bg-red-500",
    },
    fresh: {
      badge: "rtkq:bg-green-50 rtkq:text-green-700",
      icon: "rtkq:text-green-500",
      dot: "rtkq:bg-green-500",
    },
    inactive: {
      badge: "rtkq:bg-neutral-100 rtkq:text-neutral-600",
      icon: "rtkq:text-neutral-400",
      dot: "rtkq:bg-neutral-400",
    },
    uninitialized: {
      badge: "rtkq:bg-amber-50 rtkq:text-amber-700",
      icon: "rtkq:text-amber-500",
      dot: "rtkq:bg-amber-500",
    },
  },
  polling: "rtkq:bg-indigo-50 rtkq:text-indigo-600",
  json: {
    key: "rtkq:text-indigo-600",
    string: "rtkq:text-green-700",
    number: "rtkq:text-amber-700",
    boolean: "rtkq:text-blue-700",
    muted: "rtkq:text-neutral-400",
  },
};

const darkClasses: RtkQueryDevtoolsClasses = {
  root: "rtkq:bg-neutral-900 rtkq:text-neutral-100",
  surface: "rtkq:bg-neutral-800/50",
  surfaceHover: "rtkq:hover:bg-neutral-800",
  surfaceSelected: "rtkq:bg-indigo-500/10",
  border: "rtkq:border-neutral-800",
  borderInput: "rtkq:border-neutral-700",
  textPrimary: "rtkq:text-neutral-100",
  textSecondary: "rtkq:text-neutral-400",
  textMuted: "rtkq:text-neutral-500",
  textDimmed: "rtkq:text-neutral-600",
  accent: "rtkq:text-indigo-400",
  accentBorder: "rtkq:border-indigo-700",
  danger: "rtkq:text-red-400",
  dangerBorder: "rtkq:border-red-800",
  warning: "rtkq:text-amber-300",
  warningBorder: "rtkq:border-amber-700",
  status: {
    fetching: {
      badge: "rtkq:bg-blue-500/10 rtkq:text-blue-300",
      icon: "rtkq:text-blue-400",
      dot: "rtkq:bg-blue-400",
    },
    error: {
      badge: "rtkq:bg-red-500/10 rtkq:text-red-300",
      icon: "rtkq:text-red-400",
      dot: "rtkq:bg-red-400",
    },
    fresh: {
      badge: "rtkq:bg-green-500/10 rtkq:text-green-300",
      icon: "rtkq:text-green-400",
      dot: "rtkq:bg-green-400",
    },
    inactive: {
      badge: "rtkq:bg-neutral-500/10 rtkq:text-neutral-400",
      icon: "rtkq:text-neutral-500",
      dot: "rtkq:bg-neutral-500",
    },
    uninitialized: {
      badge: "rtkq:bg-amber-500/10 rtkq:text-amber-300",
      icon: "rtkq:text-amber-400",
      dot: "rtkq:bg-amber-400",
    },
  },
  polling: "rtkq:bg-indigo-500/10 rtkq:text-indigo-300",
  json: {
    key: "rtkq:text-indigo-400",
    string: "rtkq:text-green-400",
    number: "rtkq:text-amber-400",
    boolean: "rtkq:text-blue-400",
    muted: "rtkq:text-neutral-500",
  },
};

export function getClasses(mode: ThemeMode): RtkQueryDevtoolsClasses {
  return mode === "light" ? lightClasses : darkClasses;
}
