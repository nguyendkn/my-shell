# 2026-04-26 Shell Layout and Build Lessons

Archived from `docs/project/lesson-learn.md` during lossless compaction. Keep
the exact signals, causes, fixes, commands, and remember rules searchable.

### 2026-04-26 - Route And Workspace Chunk Splitting

**Signal:** After fixing the CodeMirror warning, the entry chunk was still close
to the Vite warning threshold and project detail carried terminal/chat code that
was not needed for every interaction.

**Cause:**

- `App.tsx` statically imported route pages, the app sidebar, and the toaster,
  so they were bundled into the app entry.
- `ProjectDetailPage` statically imported the terminal panel and chat shell,
  even though terminal is tab-only and chat can be its own workspace chunk.
- Dashboard's chart used the full Radix `Select` for a simple mobile time-range
  dropdown.

**Fix:**

- Lazy-load route pages, `AppSidebar`, and `Toaster` from `App.tsx`.
- Lazy-load `ProjectChatShell` and `ProjectTerminalPanel` inside project detail.
- Use `NativeSelect` for the chart time range so Dashboard does not pull the
  heavier Radix Select chunk just for that control.

**UI/UX:** The app keeps the same route behavior and controls, but initial shell
startup and project-detail route loading are broken into smaller, task-specific
chunks.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell build`
- `bun run --cwd apps/shell desktop:build`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`

**Remember:** Keep route pages and optional workspaces behind lazy boundaries.
For simple mobile-only option controls, prefer the local native select over
pulling Radix Select into an otherwise lightweight chunk.

### 2026-04-26 - Project Detail Composer Fullscreen Pinning

**Signal:** Project Detail chat composer looked like it was floating instead of
sticking to the bottom edge in fullscreen.

**Cause:**

- Project Detail reused the inset app shell margin/rounding while its chat
  workspace expected a flush fullscreen canvas.
- Cypress covered chat rendering and scrolling, but not the composer/footer
  geometry at a fullscreen viewport.

**Fix:**

- Override the inset shell margin, radius, and shadow only while Project Detail
  is active in `apps/shell/src/App.tsx`.
- Keep `ProjectChatShell` full-height and make `ProjectChatComposer` an explicit
  `sticky bottom-0` footer with stable test ids.
- Add a Cypress geometry assertion that checks the composer, shell, and scroller
  edges at 1920x1080 before and after collapsing the right panel.

**UI/UX:** The coding-agent chat now behaves like a true fullscreen work
surface: the composer is always at the bottom edge, the scroll region ends
cleanly above it, and closing the inspector does not leave the input visually
detached.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`

**Remember:** For sticky bottom controls inside an inset shell, test actual
`getBoundingClientRect()` edges at fullscreen sizes. A render-only Cypress test
will not catch clipped or floating composers.

### 2026-04-26 - CodeMirror Lazy Chunk Split

**Signal:** Vite/Electrobun build completed but warned that
`project-git-panel` was larger than 500 kB after minification.

**Cause:**

- The Git panel was lazy-loaded, but it statically imported the CodeMirror diff
  viewer.
- The viewer statically imported `codemirror` plus every language package, so
  one Git chunk carried all editor and language code.

**Fix:**

- Lazy-load `ProjectCodeViewer` from `ProjectGitPanel`.
- In `ProjectCodeViewer`, dynamically import `codemirror` and only the language
  package that matches the selected file extension.

**UI/UX:** The Git tab still opens the same diff viewer, but the first Git panel
payload is small and only pays the CodeMirror/language cost when a diff viewer
is mounted.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell build`
- `bun run --cwd apps/shell desktop:build`
- `bun run --cwd apps/shell cy:run -- --spec cypress/e2e/project-detail.cy.ts`

**Remember:** For optional editor surfaces, lazy-load both the feature panel and
the editor internals. Avoid static imports for all CodeMirror language packages
inside a panel-level lazy chunk.

### 2026-04-26 - Project Detail Tabs Preserve Flex Scroll

**Signal:** After adding main `Coding Agent` / `Terminal` tabs to Project
Detail, Cypress reported the last chat message was not visible because it was
clipped by an overflow parent.

**Cause:**

- `ProjectChatShell` relied on being a direct flex child of the detail main
  column.
- Wrapping it in `TabsContent` changed the layout context; the content was a
  flex item but not an active flex container for the chat shell.

**Fix:**

- Set active project-detail `TabsContent` panes to flex containers with
  `data-[state=active]:flex` and hide inactive panes with
  `data-[state=inactive]:hidden`.
- Keep chat scroll restoration synchronous with `useLayoutEffect` so the latest
  messages remain visible after layout changes.

**UI/UX:** The new workspace tabs can switch between the coding agent and the
terminal manager without clipping the chat history or hiding the active
composer context.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell lint`
- `bun run --cwd apps/shell cy:run --spec cypress/e2e/project-detail.cy.ts`
- `bun run --cwd apps/shell build`

**Remember:** When moving a full-height flex screen into Radix tabs, make the
active `TabsContent` a flex container and verify scroll-sensitive content in
Cypress, not just that the tab renders.

### 2026-04-26 - Project Detail Right Rail Controls

**Signal:** Project detail had two right-panel close/open controls, and the
collapsed rail only showed a generic reopen button.

**Cause:**

- The panel-local close button duplicated the header toggle.
- The collapsed state did not preserve the panel's feature map.

**Fix:**

- Keep the header button as the single right-panel toggle.
- Drive the right panel with a controlled active tab.
- Reuse the same feature metadata for open tabs and collapsed rail icons with
  compact hover previews.

**UI/UX:** Closing the panel no longer leaves a redundant control. The rail now
keeps Wiki, Files, Context, Timeline, and Git discoverable, and each icon gives
a compact status preview before opening the matching feature.

**Verify:**

- `bun run check-types` from `apps/shell`
- `bunx eslint src/pages/project-detail-page.tsx src/components/project-detail/project-side-panel.tsx cypress/e2e/project-detail.cy.ts --max-warnings 0`
- `bun run cy:run -- --spec cypress/e2e/project-detail.cy.ts`

**Remember:** When a collapsible inspector has feature tabs, use one global
toggle and let the collapsed rail summarize/select features instead of adding a
second close/open button.

### 2026-04-26 - Electrobun Taskbar-Safe Startup Maximize

**Signal:** The shell app needed to always open in maximized mode. The native
window reported maximized, but DevTools still showed `html`/viewport dimensions
from the old 1440x960 startup frame. A later native maximize attempt also let
the window cover the Windows taskbar.

**Cause:**

- A post-show `setSize()` nudge is useful for a normal-size first paint, but it
  can restore or race a window that has already been maximized.
- Electrobun's `BrowserWindow` creates the default `BrowserView` during the
  constructor using the constructor `frame`. If that frame is 1440x960, the
  default WebView can keep that viewport even after native `maximize()` when the
  Windows WebView2 auto-resize event does not settle at startup.
- Desktop Cypress started as soon as the WebView DOM was ready, not when the
  native `BrowserWindow` had finished reaching the intended work-area frame.
- DOM-only `.click()` in desktop eval can miss Radix tab state changes that rely
  on pointer/mouse event sequences.
- On Windows, taskbar-safe maximized sizing should use the display work area,
  not full screen bounds. A `setFrame()` call from the window `resize` event can
  create a resize/setFrame loop and make the Electrobun process exit before the
  desktop test health endpoint is reachable.

**Fix:**

- In `apps/shell/src/electrobun/main.ts`, use
  `Screen.getPrimaryDisplay().workArea` for the initial BrowserWindow frame so
  Electrobun's default BrowserView is created with the maximized-sized viewport.
- Call `setFrame(workArea.x, workArea.y, workArea.width, workArea.height)` after
  `show()`, on WebView `dom-ready`, and shortly after first paint. This creates
  a taskbar-safe maximized-equivalent startup frame without entering a taskbar-
  covering fullscreen-sized state.
- Expose both display `workArea` and `window.frame` from the desktop test server
  health payload. Make `apps/shell/scripts/cypress-desktop.ts` wait for both
  `domReady` and a window frame that matches the work area.
- Assert `document.documentElement.clientWidth/clientHeight` and `innerWidth` /
  `innerHeight` in desktop Cypress so tests catch stale HTML viewport
  regressions.
- Make the desktop eval click helper dispatch pointer and mouse events before
  calling `.click()`.

**Verify:**

- `bun run --cwd apps/shell check-types`
- `bun run --cwd apps/shell desktop:build`
- `bun run --cwd apps/shell cy:run:desktop`

**Remember:** For startup-maximized Electrobun windows on Windows, size the
constructor `frame` from the display work area before creating the window, then
fit the same work-area frame during startup. Do not rely on `maximize()` alone to
resize the default BrowserView viewport, do not use full screen bounds when the
taskbar must remain visible, and do not call `setFrame()` from the window
`resize` event.
