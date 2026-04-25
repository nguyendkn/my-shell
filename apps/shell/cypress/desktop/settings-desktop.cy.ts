/// <reference types="cypress" />

type DesktopEvalResponse<T> = {
  ok: boolean;
  value: T;
  error?: {
    name?: string;
    message?: string;
    stack?: string | null;
  } | null;
};

function desktopEval<T>(code: string, timeoutMs = 10_000) {
  return cy
    .request<DesktopEvalResponse<T>>("POST", "/eval", {
      code,
      timeoutMs,
    })
    .then((response) => {
      expect(response.body.ok, response.body.error?.message).to.eq(true);

      return cy.wrap(response.body.value, { log: false });
    });
}

describe("Desktop runtime settings", () => {
  it("opens Settings, edits runtime JSON, saves, and reloads it", () => {
    cy.request("/health")
      .its("body")
      .should("include", {
        ok: true,
        mode: "desktop",
        domReady: true,
      });

    const marker = `desktop-settings-${Date.now()}`;
    const nextSettings = {
      $schema: "https://json.schemastore.org/claude-code-settings.json",
      model: marker,
      env: {
        FPTCLAW_SETTINGS_TEST: marker,
      },
    };

    desktopEval<{
      pathname: string;
      headerTitle: string;
      pageTitle: string;
      sourcePath: string;
      schemaUrl: string;
      savedText: string;
    }>(
      `
      const nextSettings = ${JSON.stringify(nextSettings)};
      const nextContent = JSON.stringify(nextSettings, null, 2) + "\\n";

      if (location.pathname !== "/settings") {
        await waitFor(() => query('[data-testid="app-sidebar-settings"]'), 15000);
        click('[data-testid="app-sidebar-settings"]');
      }

      await waitFor(() => location.pathname === "/settings", 15000);
      await waitFor(() => query('[data-testid="settings-page"]'), 15000);
      await waitFor(() => query('[data-testid="runtime-settings-editor"]')?.__runtimeSettingsEditorView, 15000);

      let editorHost = query('[data-testid="runtime-settings-editor"]');
      let view = editorHost.__runtimeSettingsEditorView;

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: nextContent,
        },
      });

      await waitFor(() => {
        const saveButton = query('[data-testid="runtime-settings-save"]');

        return saveButton && saveButton.disabled === false;
      }, 15000);

      click('[data-testid="runtime-settings-save"]');

      await waitFor(() => {
        const state = query('[data-testid="runtime-settings-save-state"]')?.textContent ?? "";

        return state.includes("Saved");
      }, 15000);

      click('[data-testid="runtime-settings-reload"]');

      const savedText = await waitFor(() => {
        editorHost = query('[data-testid="runtime-settings-editor"]');
        view = editorHost?.__runtimeSettingsEditorView;
        const text = view?.state.doc.toString() ?? "";

        return text.includes(nextSettings.env.FPTCLAW_SETTINGS_TEST) ? text : false;
      }, 15000);

      return {
        pathname: location.pathname,
        headerTitle: query('header h1')?.textContent?.trim() ?? "",
        pageTitle: query('[data-testid="settings-page"] h1')?.textContent?.trim() ?? "",
        sourcePath: query('[data-testid="runtime-settings-source-path"]')?.textContent?.trim() ?? "",
        schemaUrl: query('[data-testid="runtime-settings-schema-url"]')?.textContent?.trim() ?? "",
        savedText,
      };
    `,
      30_000,
    ).then((result) => {
      expect(result.pathname).to.eq("/settings");
      expect(result.headerTitle).to.eq("Settings");
      expect(result.pageTitle).to.eq("Runtime Settings");
      expect(result.sourcePath).to.contain("settings.local.json");
      expect(result.schemaUrl).to.eq(
        "https://json.schemastore.org/claude-code-settings.json",
      );
      expect(result.savedText).to.contain(marker);
    });
  });
});
