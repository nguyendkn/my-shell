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
      empty: boolean;
      operationStatus: string;
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
        const loading = query('[data-testid="project-browser-profile-loading"]');
        const operationStatus =
          query('[data-testid="project-browser-profile-operation-status"]')?.textContent ?? "";

        if (!panel || loading || providers < 2) {
          return false;
        }

        return {
          providers,
          profiles,
          empty: Boolean(query('[data-testid="project-browser-profile-empty"]')),
          operationStatus,
          hasElectrobun: Boolean(window.__electrobun),
        };
      });
    `).then((result) => {
      expect(result.hasElectrobun).to.eq(true);
      expect(result.providers).to.eq(2);
      expect(result.profiles).to.eq(0);
      expect(result.empty).to.eq(true);
      expect(result.operationStatus).to.contain("Project folder is unavailable");
    });

    desktopEval<{ beforeCount: number; afterCount: number; operationStatus: string }>(`
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
        const operationStatus =
          query('[data-testid="project-browser-profile-operation-status"]')?.textContent ?? "";

        if (!operationStatus.includes("Project folder is unavailable")) {
          return false;
        }

        return {
          beforeCount,
          afterCount,
          operationStatus,
        };
      }, 15000);
    `).then((result) => {
      expect(result.beforeCount).to.eq(0);
      expect(result.afterCount).to.eq(0);
      expect(result.operationStatus).to.contain("Project folder is unavailable");
    });
  });

  it("focuses split terminals full screen inside the desktop runtime", () => {
    desktopEval<{
      terminalCount: number;
      panes: number;
      fullscreen: string | undefined;
      toolbarButtons: Array<string | null>;
      commandOutput: string;
      rect: { top: number; left: number; width: number; height: number };
      viewport: { width: number; height: number };
      hasElectrobun: boolean;
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

      await waitFor(() => query('[data-testid="project-workspace-tab-terminal"]'), 15000);
      click('[data-testid="project-workspace-tab-terminal"]');
      await waitFor(() => query('[data-testid="project-terminal-split"]'), 15000);

      function setInputValue(selector, value) {
        const input = query(selector);
        const valueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )?.set;

        valueSetter?.call(input, value);
        input.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: value,
          }),
        );
      }

      const toolbarButtons = Array.from(
        document.querySelectorAll('[data-testid="project-terminal-toolbar"] button'),
      ).map((button) => button.getAttribute("data-testid"));

      await waitFor(() => query('[data-testid="project-terminal-command-input"]:not(:disabled)'), 15000);
      setInputValue(
        '[data-testid="project-terminal-command-input"]',
        'Write-Output fptclaw-terminal-ok',
      );
      click('[data-testid="project-terminal-command-run"]');

      const commandOutput = await waitFor(() => {
        const text = document.body.textContent ?? "";

        return text.includes("fptclaw-terminal-ok") ? text : false;
      }, 15000);

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
          commandOutput,
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
    `,
      30_000,
    ).then((result) => {
      expect(result.hasElectrobun).to.eq(true);
      expect(result.toolbarButtons[0]).to.eq("project-terminal-fullscreen");
      expect(result.toolbarButtons[1]).to.eq("project-terminal-split");
      expect(result.commandOutput).to.contain("fptclaw-terminal-ok");
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
      hasEmptyState: boolean;
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
          hasEmptyState: Boolean(query('[data-testid="project-chat-empty"]')),
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
      expect(result.messageCount).to.eq(0);
      expect(result.hasEmptyState).to.eq(true);
    });
  });

  it("sends a desktop chat message and renders the native runtime response", () => {
    desktopEval<{
      hasElectrobun: boolean;
      completed: boolean;
      messageCount: number;
      assistantText: string;
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
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          bubbles: true,
          cancelable: true,
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!document.body.textContent?.includes("/vk:ask hi")) {
        click('[data-testid="project-chat-send"]');
      }

      const result = await waitFor(() => {
        const text = document.body.textContent ?? "";
        const messages = Array.from(
          document.querySelectorAll('[data-testid="project-chat-message"]'),
        ).map((message) => message.textContent ?? "");
        const assistantText =
          messages.find((message) => message.includes("FPTClaw Runtime")) ?? "";
        const completed =
          text.includes("Runtime completed") ||
          text.includes("Runtime complete");

        if (text.includes("Runtime package entrypoint was not found")) {
          return {
            hasElectrobun: Boolean(window.__electrobun),
            completed,
            messageCount: messages.length,
            assistantText,
            text,
          };
        }

        if (completed && assistantText.length > "FPTClaw Runtime".length + 8) {
          return {
            hasElectrobun: Boolean(window.__electrobun),
            completed,
            messageCount: messages.length,
            assistantText,
            text,
          };
        }

        return false;
      }, 90000);

      return result;
    `,
      100_000,
    ).then((result) => {
      expect(result.hasElectrobun).to.eq(true);
      expect(result.text).to.not.contain(
        "Runtime package entrypoint was not found",
      );
      expect(result.text).to.not.contain("Runtime unavailable");
      expect(result.completed).to.eq(true);
      expect(result.messageCount).to.be.greaterThan(1);
      expect(result.assistantText).to.contain("FPTClaw Runtime");
    });
  });
});
