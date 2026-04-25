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

describe("Desktop project creation", () => {
  it("uses the Electrobun desktop runtime to select a project folder", () => {
    cy.request("/health")
      .its("body")
      .should("include", {
        ok: true,
        mode: "desktop",
        domReady: true,
      })
      .then((health) => {
        expect(health.projectFolderPath).to.be.a("string");
        expect(health.projectFolderPath.length).to.be.greaterThan(0);
        expect(health.window.frame.x).to.be.closeTo(
          health.display.workArea.x,
          2,
        );
        expect(health.window.frame.y).to.be.closeTo(
          health.display.workArea.y,
          2,
        );
        expect(health.window.frame.width).to.be.closeTo(
          health.display.workArea.width,
          4,
        );
        expect(health.window.frame.height).to.be.closeTo(
          health.display.workArea.height,
          4,
        );

        desktopEval<{
          clientWidth: number;
          clientHeight: number;
          innerWidth: number;
          innerHeight: number;
        }>(`
          return {
            clientWidth: document.documentElement.clientWidth,
            clientHeight: document.documentElement.clientHeight,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
          };
        `).then((viewport) => {
          expect(viewport.clientWidth).to.eq(viewport.innerWidth);
          expect(viewport.clientHeight).to.eq(viewport.innerHeight);
          expect(viewport.clientWidth).to.be.greaterThan(
            Math.min(health.display.workArea.width - 96, 1440),
          );
          expect(viewport.clientHeight).to.be.greaterThan(
            Math.min(health.display.workArea.height - 140, 800),
          );
          expect(viewport.clientHeight).to.be.lessThan(
            health.display.bounds.height,
          );
        });
      });

    desktopEval<boolean>("return Boolean(window.__electrobun);").should(
      "eq",
      true,
    );

    desktopEval<{ path: string; name: string }>(`
      if (!location.pathname.match(/^\\/projects$/)) {
        history.pushState(null, "", "/projects");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }

      await waitFor(() => query('[data-testid="project-create-open"]'), 15000);
      click('[data-testid="project-create-open"]');
      await waitFor(() => query('[data-testid="project-create-browse"]'), 15000);
      click('[data-testid="project-create-browse"]');

      return await waitFor(() => {
        const pathInput = query('[data-testid="project-create-path"]');
        const nameInput = query('[data-testid="project-create-name"]');

        if (!pathInput?.value || !nameInput?.value) {
          return false;
        }

        return {
          path: pathInput.value,
          name: nameInput.value,
        };
      }, 15000);
    `).then(({ path, name }) => {
      expect(path).to.not.eq("");
      expect(name).to.not.eq("");

      desktopEval<{ pathname: string; title: string }>(`
        const expectedName = ${JSON.stringify(name)};

        click('[data-testid="project-create-submit"]');

        return await waitFor(() => {
          const title = query('h1')?.textContent?.trim();

          if (
            !location.pathname.match(/^\\/projects\\/\\d+$/) ||
            title !== expectedName
          ) {
            return false;
          }

          return {
            pathname: location.pathname,
            title,
          };
        }, 15000);
      `).then((detail) => {
        expect(detail.pathname).to.match(/^\/projects\/\d+$/);
        expect(detail.title).to.eq(name);
      });
    });
  });

  it("opens browser profiles inside the Electrobun desktop runtime", () => {
    desktopEval<{
      providers: number;
      profiles: number;
      hasElectrobun: boolean;
    }>(`
      if (!location.pathname.match(/^\\/projects\\/1$/)) {
        history.pushState(null, "", "/projects/1");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }

      await waitFor(() => query('[data-testid="project-workspace-tab-browser-profiles"]'));
      click('[data-testid="project-workspace-tab-browser-profiles"]');

      return await waitFor(() => {
        const panel = query('[data-testid="project-browser-profiles-panel"]');
        const providers = document.querySelectorAll('[data-testid="project-browser-provider"]').length;
        const profiles = document.querySelectorAll('[data-testid="project-browser-profile-row"]').length;

        if (!panel || providers < 2 || profiles < 3) {
          return false;
        }

        return {
          providers,
          profiles,
          hasElectrobun: Boolean(window.__electrobun),
        };
      });
    `).then((result) => {
      expect(result.hasElectrobun).to.eq(true);
      expect(result.providers).to.eq(2);
      expect(result.profiles).to.be.at.least(3);
    });

    desktopEval<{ beforeCount: number; afterCount: number; firstRow: string }>(`
      const panel = await waitFor(
        () => query('[data-testid="project-browser-profiles-panel"]'),
        15000,
      );
      const beforeCount = Number(panel?.dataset.profileCount ?? 0);

      if (!query('[data-testid="project-browser-profile-create"]')) {
        click('[data-testid="project-workspace-tab-browser-profiles"]');
      }

      await waitFor(() => query('[data-testid="project-browser-profile-create"]'), 15000);
      click('[data-testid="project-browser-profile-create"]');

      return await waitFor(() => {
        const nextPanel = query('[data-testid="project-browser-profiles-panel"]');
        const afterCount = Number(nextPanel?.dataset.profileCount ?? 0);
        const firstRow = query('[data-testid="project-browser-profile-row"]')?.textContent ?? "";

        if (afterCount !== beforeCount + 1 || !firstRow.includes("Camoufox lane")) {
          return false;
        }

        return {
          beforeCount,
          afterCount,
          firstRow,
        };
      }, 15000);
    `).then((result) => {
      expect(result.beforeCount).to.be.at.least(3);
      expect(result.afterCount).to.eq(result.beforeCount + 1);
      expect(result.firstRow).to.contain("Needs setup");
    });
  });

  it("focuses split terminals full screen inside the desktop runtime", () => {
    desktopEval<{
      terminalCount: number;
      panes: number;
      fullscreen: string | undefined;
      toolbarButtons: Array<string | null>;
      rect: { top: number; left: number; width: number; height: number };
      viewport: { width: number; height: number };
      hasElectrobun: boolean;
    }>(`
      if (!location.pathname.match(/^\\/projects\\/1$/)) {
        history.pushState(null, "", "/projects/1");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }

      await waitFor(() => query('[data-testid="project-workspace-tab-terminal"]'), 15000);
      click('[data-testid="project-workspace-tab-terminal"]');
      await waitFor(() => query('[data-testid="project-terminal-split"]'), 15000);

      const toolbarButtons = Array.from(
        document.querySelectorAll('[data-testid="project-terminal-toolbar"] button'),
      ).map((button) => button.getAttribute("data-testid"));

      click('[data-testid="project-terminal-split"]');
      await waitFor(() => {
        const panel = query('[data-testid="project-terminal-panel"]');

        return Number(panel?.dataset.terminalCount ?? 0) >= 2;
      }, 15000);

      click('[data-testid="project-terminal-fullscreen"]');

      return await waitFor(() => {
        const panel = query('[data-testid="project-terminal-panel"]');

        if (!panel || panel.dataset.fullscreen !== "true") {
          return false;
        }

        const panes = document.querySelectorAll('[data-testid="project-terminal-pane"]').length;
        const rect = panel.getBoundingClientRect();
        const fillsViewport =
          Math.abs(rect.top) <= 1 &&
          Math.abs(rect.left) <= 1 &&
          Math.abs(rect.width - window.innerWidth) <= 1 &&
          Math.abs(rect.height - window.innerHeight) <= 1;

        if (panes < 2 || !fillsViewport) {
          return false;
        }

        return {
          terminalCount: Number(panel.dataset.terminalCount ?? 0),
          panes,
          fullscreen: panel.dataset.fullscreen,
          toolbarButtons,
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          hasElectrobun: Boolean(window.__electrobun),
        };
      }, 15000);
    `).then((result) => {
      expect(result.hasElectrobun).to.eq(true);
      expect(result.toolbarButtons[0]).to.eq("project-terminal-fullscreen");
      expect(result.toolbarButtons[1]).to.eq("project-terminal-split");
      expect(result.terminalCount).to.be.at.least(2);
      expect(result.panes).to.eq(result.terminalCount);
      expect(result.fullscreen).to.eq("true");
      expect(result.rect.width).to.be.closeTo(result.viewport.width, 1);
      expect(result.rect.height).to.be.closeTo(result.viewport.height, 1);
    });

    desktopEval<{ fullscreen: string | undefined; terminalCount: number }>(`
      click('[data-testid="project-terminal-exit-fullscreen"]');

      return await waitFor(() => {
        const panel = query('[data-testid="project-terminal-panel"]');

        if (!panel || panel.dataset.fullscreen !== "false") {
          return false;
        }

        return {
          fullscreen: panel.dataset.fullscreen,
          terminalCount: Number(panel.dataset.terminalCount ?? 0),
        };
      }, 15000);
    `).then((result) => {
      expect(result.fullscreen).to.eq("false");
      expect(result.terminalCount).to.be.at.least(2);
    });
  });

  it("reads project runtime status through the native runtime bridge", () => {
    desktopEval<{
      hasElectrobun: boolean;
      status: string;
      text: string;
      messageCount: number;
    }>(
      `
      if (!location.pathname.match(/^\\/projects\\/1$/)) {
        history.pushState(null, "", "/projects/1");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }

      await waitFor(() => query('[data-testid="project-chat-input"]'));

      return await waitFor(() => {
        const status = query('[data-testid="project-runtime-summary"]')?.textContent ?? "";

        if (!status.includes("Runtime")) {
          return false;
        }

        return {
          hasElectrobun: Boolean(window.__electrobun),
          status,
          text: document.body.textContent ?? "",
          messageCount: document.querySelectorAll('[data-testid="project-chat-message"]').length,
        };
      }, 20000);
    `,
      25_000,
    ).then((result) => {
      expect(result.hasElectrobun).to.eq(true);
      expect(result.status).to.contain("Runtime");
      expect(result.text).to.not.contain(
        "Runtime package entrypoint was not found",
      );
      expect(result.messageCount).to.be.greaterThan(4);
    });
  });

  it("starts a desktop chat turn without losing the runtime entrypoint", () => {
    desktopEval<{
      hasElectrobun: boolean;
      foundRuntimeStart: boolean;
      text: string;
    }>(
      `
      if (!location.pathname.match(/^\\/projects$/)) {
        history.pushState(null, "", "/projects");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }

      await waitFor(() => query('[data-testid="project-create-open"]'), 15000);
      click('[data-testid="project-create-open"]');
      await waitFor(() => query('[data-testid="project-create-browse"]'), 15000);
      click('[data-testid="project-create-browse"]');

      const project = await waitFor(() => {
        const pathInput = query('[data-testid="project-create-path"]');
        const nameInput = query('[data-testid="project-create-name"]');

        if (!pathInput?.value || !nameInput?.value) {
          return false;
        }

        return {
          path: pathInput.value,
          name: nameInput.value,
        };
      }, 15000);

      click('[data-testid="project-create-submit"]');
      await waitFor(() => {
        const title = query('h1')?.textContent?.trim();

        return location.pathname.match(/^\\/projects\\/\\d+$/) && title === project.name;
      }, 15000);

      const input = await waitFor(() => query('[data-testid="project-chat-input"]'), 15000);
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set;

      valueSetter?.call(input, "/vk:ask hi");
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: "/vk:ask hi",
        }),
      );

      await waitFor(() => query('[data-testid="project-chat-send"]:not(:disabled)'), 5000);
      click('[data-testid="project-chat-send"]');

      const result = await waitFor(() => {
        const text = document.body.textContent ?? "";

        if (text.includes("Runtime package entrypoint was not found")) {
          return {
            hasElectrobun: Boolean(window.__electrobun),
            foundRuntimeStart: false,
            text,
          };
        }

        if (
          text.includes("Runtime package") ||
          text.includes("runtime tools ready") ||
          text.includes("Runtime initialized")
        ) {
          return {
            hasElectrobun: Boolean(window.__electrobun),
            foundRuntimeStart: true,
            text,
          };
        }

        return false;
      }, 20000);

      if (query('[data-testid="project-chat-send"]')) {
        click('[data-testid="project-chat-send"]');
      }

      return result;
    `,
      25_000,
    ).then((result) => {
      expect(result.hasElectrobun).to.eq(true);
      expect(result.text).to.not.contain(
        "Runtime package entrypoint was not found",
      );
      expect(result.foundRuntimeStart).to.eq(true);
    });
  });
});
