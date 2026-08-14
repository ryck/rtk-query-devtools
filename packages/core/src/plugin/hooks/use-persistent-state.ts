import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";

/**
 * Namespaced so panel preferences can never collide with the host app's own
 * storage, nor with the TanStack DevTools shell's `tanstack_devtools_state`.
 */
const PREFIX = "rtkq-devtools:";

/**
 * For values `JSON.stringify` can't round-trip on its own — `Set`, `Map`, and
 * friends. `parse` returning `undefined` means "stored value is unusable",
 * which falls back to the initial value rather than throwing.
 */
export interface PersistCodec<T> {
  serialize: (value: T) => unknown;
  parse: (raw: unknown) => T | undefined;
}

function read<T>(key: string, initial: T, codec: PersistCodec<T> | undefined): T {
  // `localStorage` throws on access in some privacy modes, and is absent
  // entirely during SSR — persistence is a convenience, never a hard
  // dependency, so every failure path silently yields the initial value.
  try {
    if (typeof window === "undefined") return initial;
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return initial;
    const parsed: unknown = JSON.parse(raw);
    const value = codec ? codec.parse(parsed) : (parsed as T);
    return value === undefined ? initial : value;
  } catch {
    return initial;
  }
}

/**
 * `useState` that survives a reload. Reads once on mount and writes on every
 * change; storage failures (quota, private mode) are swallowed.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  codec?: PersistCodec<T>,
): [T, Dispatch<SetStateAction<T>>] {
  // Held in a ref so an inline codec object doesn't retrigger the write effect
  // on every render.
  const codecRef = useRef(codec);
  codecRef.current = codec;

  const [value, setValue] = useState<T>(() => read(key, initial, codec));

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const current = codecRef.current;
      const payload = current ? current.serialize(value) : value;
      window.localStorage.setItem(PREFIX + key, JSON.stringify(payload));
    } catch {
      // Best-effort only.
    }
  }, [key, value]);

  return [value, setValue];
}

/** Codec for `Set`s of primitives, stored as a plain array. */
export function setCodec<T extends string>(allowed?: ReadonlyArray<T>): PersistCodec<Set<T>> {
  return {
    serialize: (value) => Array.from(value),
    parse: (raw) => {
      if (!Array.isArray(raw)) return undefined;
      // Values from storage are untrusted — a stale build may have written
      // names this build no longer knows about.
      const items = raw.filter(
        (item): item is T => typeof item === "string" && (!allowed || allowed.includes(item as T)),
      );
      return new Set(items);
    },
  };
}

/** Codec for a value constrained to a known set of strings. */
export function enumCodec<T extends string>(allowed: ReadonlyArray<T>): PersistCodec<T> {
  return {
    serialize: (value) => value,
    parse: (raw) =>
      typeof raw === "string" && allowed.includes(raw as T) ? (raw as T) : undefined,
  };
}

/** Codec for the `1 | -1` sort direction. */
export const sortOrderCodec: PersistCodec<1 | -1> = {
  serialize: (value) => value,
  parse: (raw) => (raw === 1 || raw === -1 ? raw : undefined),
};
