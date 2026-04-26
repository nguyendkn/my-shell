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

type BrowserHarnessChatResult = {
  hasElectrobun: boolean;
  messageCount: number;
  titleCheckCount: number;
  workerReportCount: number;
  processTitleMessages: string[];
  validationText: string;
  text: string;
  pids: number[];
};

function desktopEval<T>(code: string, timeoutMs = 10_000) {
  return cy
    .request<DesktopEvalResponse<T>>({
      method: "POST",
      url: "/eval",
      body: {
        code,
        timeoutMs,
      },
      timeout: timeoutMs + 5_000,
    })
    .then((response) => {
      expect(response.body.ok, response.body.error?.message).to.eq(true);

      return cy.wrap(response.body.value, { log: false });
    });
}

function expectDesktopHealth() {
  cy.request("/health").its("body").should("include", {
    ok: true,
    mode: "desktop",
    domReady: true,
  });
}

function expectNoHarnessBrowserProcesses(attempt = 1) {
  cy.exec(
    [
      "powershell.exe",
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy Bypass",
      "-File",
      "scripts/count-harness-browser-processes.ps1",
    ].join(" "),
    { timeout: 45_000 },
  ).then((result) => {
    const processCount = Number(result.stdout.trim() || 0);

    if (processCount === 0) {
      return;
    }

    if (attempt >= 15) {
      expect(processCount).to.eq(0);
      return;
    }

    cy.wait(500);
    expectNoHarnessBrowserProcesses(attempt + 1);
  });
}

function runHeadedBrowserHarnessChat({
  prompt,
  expectedAgents,
}: {
  prompt: string;
  expectedAgents: number;
}) {
  return desktopEval<BrowserHarnessChatResult>(
    `
      function setTextareaValue(selector, value) {
        const input = query(selector);
        const valueSetter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
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

      await waitFor(() => query('[data-testid="project-chat-input"]'), 15000);
      setTextareaValue('[data-testid="project-chat-input"]', ${JSON.stringify(prompt)});
      await waitFor(() => query('[data-testid="project-chat-send"]:not(:disabled)'), 5000);
      click('[data-testid="project-chat-send"]');

      return await waitFor(() => {
        const messages = Array.from(
          document.querySelectorAll('[data-testid="project-chat-message"]'),
        ).map((message) => (message.textContent ?? "").replace(/\\s+/g, " ").trim());
        const text = document.body.textContent ?? "";
        const processTitleMessages = messages.filter((message) =>
          message.includes("Browser process title")
        );
        const titleCheckCount = processTitleMessages.filter((message) =>
          message.includes("Command line title marker verified: yes") &&
          message.includes("Mode: headed")
        ).length;
        const workerReportCount = messages.filter((message) =>
          message.includes("report") &&
          message.includes("verified browser process title")
        ).length;
        const validationText =
          messages.find((message) => message.includes("Lead validation passed")) ?? "";
        const pids = Array.from(
          new Set(
            processTitleMessages
              .map((message) => message.match(/PID: (\\d+)/)?.[1])
              .filter(Boolean)
              .map(Number)
          ),
        );

        if (
          titleCheckCount < ${expectedAgents} ||
          workerReportCount < ${expectedAgents} ||
          pids.length < ${expectedAgents} ||
          !validationText.includes("${expectedAgents}/${expectedAgents} browser agents")
        ) {
          return false;
        }

        return {
          hasElectrobun: Boolean(window.__electrobun),
          messageCount: messages.length,
          titleCheckCount,
          workerReportCount,
          processTitleMessages,
          validationText,
          text,
          pids,
        };
      }, 60000);
    `,
    75_000,
  );
}

describe("Desktop browser harness chat", () => {
  beforeEach(() => {
    expectDesktopHealth();
  });

  afterEach(() => {
    expectNoHarnessBrowserProcesses();
  });

  it("runs one headed browser profile from chat and validates lead/worker reporting", () => {
    const prompt = [
      "Hermes Browser Harness Local AGI:",
      "open 1 browser profile headed",
      "start https://example.com/single-headed",
      "endpoint validate browser process title and report back to lead",
    ].join(" ");

    runHeadedBrowserHarnessChat({ prompt, expectedAgents: 1 }).then(
      (result) => {
        expect(result.hasElectrobun).to.eq(true);
        expect(result.messageCount).to.be.greaterThan(4);
        expect(result.titleCheckCount).to.eq(1);
        expect(result.workerReportCount).to.eq(1);
        expect(result.pids).to.have.length(1);
        expect(result.validationText).to.contain("Lead validation passed");
        expect(result.text).to.contain("Hermes lead");
        expect(result.text).to.contain("Team: 1 browser agents");
        expect(result.text).to.contain("Mode: headed");
        expect(result.text).to.not.contain("Mode: headless");
        expect(result.text).to.contain(
          "Start point: https://example.com/single-headed",
        );
        expect(result.text).to.contain(
          "Endpoint: validate browser process title and report back to lead",
        );
        expect(result.text).to.contain("FPTClaw Browser Harness");
      },
    );
  });

  it("runs two headed browser profiles in parallel with one agent per profile", () => {
    const prompt = [
      "Hermes Browser Harness Local AGI:",
      "open 2 browser profiles headed",
      "start https://example.com/multi-headed",
      "endpoint validate browser process title and worker reports",
    ].join(" ");

    runHeadedBrowserHarnessChat({ prompt, expectedAgents: 2 }).then(
      (result) => {
        expect(result.hasElectrobun).to.eq(true);
        expect(result.titleCheckCount).to.eq(2);
        expect(result.workerReportCount).to.eq(2);
        expect(result.pids).to.have.length(2);
        expect(new Set(result.pids).size).to.eq(2);
        expect(result.validationText).to.contain("2/2 browser agents");
        expect(result.text).to.contain("Team: 2 browser agents");
        expect(result.text).to.contain("Hermes browser agent 1");
        expect(result.text).to.contain("Hermes browser agent 2");
        expect(result.text).to.contain("Mode: headed");
        expect(result.text).to.not.contain("Mode: headless");
        expect(result.text).to.contain(
          "Start point: https://example.com/multi-headed",
        );
        expect(result.text).to.contain(
          "Endpoint: validate browser process title and worker reports",
        );
      },
    );
  });

  it("keeps headed mode when the prompt uses headless=false wording", () => {
    const prompt = [
      "Hermes agent per browser:",
      "open 2 profiles with headless=false",
      "start point: https://example.com/headless-false",
      "endpoint: lead validates every headed window title",
    ].join(" ");

    runHeadedBrowserHarnessChat({ prompt, expectedAgents: 2 }).then(
      (result) => {
        expect(result.hasElectrobun).to.eq(true);
        expect(result.titleCheckCount).to.eq(2);
        expect(result.workerReportCount).to.eq(2);
        expect(result.validationText).to.contain("Lead validation passed");
        expect(result.text).to.contain("Team: 2 browser agents");
        expect(result.text).to.contain("Mode: headed");
        expect(result.text).to.not.contain("Mode: headless");
        expect(result.text).to.contain(
          "Start point: https://example.com/headless-false",
        );
        expect(result.text).to.contain(
          "Endpoint: lead validates every headed window title",
        );
        expect(
          result.processTitleMessages.every((message) =>
            message.includes("Command line title marker verified: yes"),
          ),
        ).to.eq(true);
      },
    );
  });
});
