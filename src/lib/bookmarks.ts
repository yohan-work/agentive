import { useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "agent-archive:bookmarks";
const CHANGE_EVENT = "agent-archive:bookmarks-changed";

function parseBookmarks(raw: string | null): string[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

// Used when localStorage can't be written (private mode, blocked site data, quota), so bookmarks
// still work for the rest of the session instead of silently doing nothing.
let memoryFallback: string | null = null;

function readRaw() {
  if (memoryFallback !== null) {
    return memoryFallback;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readBookmarks() {
  return typeof window === "undefined" ? [] : parseBookmarks(readRaw());
}

export function writeBookmarks(bookmarks: string[]) {
  const value = JSON.stringify(Array.from(new Set(bookmarks)));
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
    memoryFallback = null;
  } catch {
    memoryFallback = value;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Bookmarked agent slugs from localStorage, kept in sync across components and tabs. */
export function useBookmarks() {
  // Subscribe to the raw string so the snapshot is stable between renders; parse it separately.
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => parseBookmarks(raw), [raw]);
}
