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

function readRaw() {
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
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(bookmarks))));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); bookmarks just won't persist.
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
