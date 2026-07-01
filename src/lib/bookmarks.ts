const STORAGE_KEY = "agent-archive:bookmarks";

export function readBookmarks() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function writeBookmarks(bookmarks: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(bookmarks))));
}
