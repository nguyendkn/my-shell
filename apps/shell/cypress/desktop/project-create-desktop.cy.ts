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
      });

    desktopEval<boolean>("return Boolean(window.__electrobun);").should(
      "eq",
      true,
    );

    desktopEval<{ path: string; name: string }>(`
      await waitFor(() => query('[data-testid="project-create-open"]'));
      click('[data-testid="project-create-open"]');
      await waitFor(() => query('[data-testid="project-create-browse"]'));
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
      });
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
        });
      `).then((detail) => {
        expect(detail.pathname).to.match(/^\/projects\/\d+$/);
        expect(detail.title).to.eq(name);
      });
    });
  });
});
