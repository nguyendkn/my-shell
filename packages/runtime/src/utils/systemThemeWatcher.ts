// Stub: system theme watcher. No-op in external builds.
export type ThemeChangeHandler = (theme: "light" | "dark") => void;

// Two-argument variant: callers pass an OS-query function plus the
// change handler so the watcher can seed the initial theme. The stub
// ignores both and returns an inert cleanup.
export function watchSystemTheme(
  _queryOrHandler: unknown,
  _handler?: ThemeChangeHandler,
): () => void {
  return () => {};
}
