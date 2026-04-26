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

describe("Desktop browser harness chat", () => {
  it("spawns one Hermes lead and one browser agent per profile from chat", () => {
    cy.request("/health")
      .its("body")
      .should("include", {
        ok: true,
        mode: "desktop",
        domReady: true,
      });

    desktopEval<{
      hasElectrobun: boolean;
      messageCount: number;
      titleCheckCount: number;
      workerReportCount: number;
      validationText: string;
      text: string;
    }>(
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

      const prompt = [
        "Hermes Browser Harness Local AGI:",
        "open 2 browser profiles headed",
        "start https://example.com",
        "endpoint validate browser process title and worker reports",
      ].join(" ");

      await waitFor(() => query('[data-testid="project-chat-input"]'), 15000);
      setTextareaValue('[data-testid="project-chat-input"]', prompt);
      await waitFor(() => query('[data-testid="project-chat-send"]:not(:disabled)'), 5000);
      click('[data-testid="project-chat-send"]');

      return await waitFor(() => {
        const messages = Array.from(
          document.querySelectorAll('[data-testid="project-chat-message"]'),
        ).map((message) => (message.textContent ?? "").replace(/\\s+/g, " ").trim());
        const text = document.body.textContent ?? "";
        const titleCheckCount = messages.filter((message) =>
          message.includes("Browser process title") &&
          message.includes("Command line title marker verified: yes")
        ).length;
        const workerReportCount = messages.filter((message) =>
          message.includes("report") &&
          message.includes("verified browser process title")
        ).length;
        const validationText =
          messages.find((message) => message.includes("Lead validation passed")) ?? "";

        if (
          titleCheckCount < 2 ||
          workerReportCount < 2 ||
          !validationText.includes("2/2 browser agents")
        ) {
          return false;
        }

        return {
          hasElectrobun: Boolean(window.__electrobun),
          messageCount: messages.length,
          titleCheckCount,
          workerReportCount,
          validationText,
          text,
        };
      }, 60000);
    `,
      75_000,
    ).then((result) => {
      expect(result.hasElectrobun).to.eq(true);
      expect(result.messageCount).to.be.greaterThan(5);
      expect(result.titleCheckCount).to.eq(2);
      expect(result.workerReportCount).to.eq(2);
      expect(result.validationText).to.contain("Lead validation passed");
      expect(result.text).to.contain("Hermes lead");
      expect(result.text).to.contain("Team: 2 browser agents");
      expect(result.text).to.contain("FPTClaw Browser Harness");
    });
  });
});
