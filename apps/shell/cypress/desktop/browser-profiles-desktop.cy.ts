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

describe("Desktop browser profiles integration", () => {
  it("creates, verifies, warms, and launch-checks project browser profiles through native storage", () => {
    cy.request("/health")
      .its("body")
      .should("include", {
        ok: true,
        mode: "desktop",
        domReady: true,
      });

    desktopEval<{
      hasElectrobun: boolean;
      harnessTitle: string;
      providerReadyCount: string;
      beforeCount: number;
      afterCreateCount: number;
      afterWarmCount: number;
      createdRow: string;
      createdDetail: string;
      verifiedDetail: string;
      warmedDetail: string;
      launchStatus: string;
      registryStatus: string;
      storagePath: string;
    }>(
      `
      function text(selector) {
        return (query(selector)?.textContent ?? "").replace(/\\s+/g, " ").trim();
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

      await waitFor(() => query('[data-testid="project-workspace-tab-browser-profiles"]'), 15000);
      click('[data-testid="project-workspace-tab-browser-profiles"]');

      const panel = await waitFor(() => {
        const nextPanel = query('[data-testid="project-browser-profiles-panel"]');
        const createButton = query('[data-testid="project-browser-profile-create"]');
        const title = text('[data-testid="project-browser-harness-title"]');
        const loading = query('[data-testid="project-browser-profile-loading"]');

        if (
          !nextPanel ||
          !createButton ||
          loading ||
          !title.includes("Native browser profiles")
        ) {
          return false;
        }

        return nextPanel;
      }, 15000);

      const beforeCount = Number(panel.dataset.profileCount ?? 0);
      await waitFor(() => query('[data-testid="project-browser-profile-create"]'), 15000);
      click('[data-testid="project-browser-profile-create"]');

      const created = await waitFor(() => {
        const nextPanel = query('[data-testid="project-browser-profiles-panel"]');
        const firstRow = query('[data-testid="project-browser-profile-row"]');
        const detail = text('[data-testid="project-browser-profile-detail"]');
        const status = text('[data-testid="project-browser-profile-operation-status"]');
        const afterCount = Number(nextPanel?.dataset.profileCount ?? 0);

        if (
          afterCount !== beforeCount + 1 ||
          !firstRow ||
          !detail.includes("Camoufox lane") ||
          !detail.includes(".fptclaw") ||
          !status.includes("Profile storage created")
        ) {
          return false;
        }

        return {
          afterCount,
          row: (firstRow.textContent ?? "").replace(/\\s+/g, " ").trim(),
          detail,
          status,
        };
      }, 15000);

      click('[data-testid="project-browser-profile-verify"]');
      const verifiedDetail = await waitFor(() => {
        const detail = text('[data-testid="project-browser-profile-detail"]');
        const status = text('[data-testid="project-browser-profile-operation-status"]');

        if (!status.includes("Profile verified") || !detail.includes("Profile storage verified")) {
          return false;
        }

        return detail;
      }, 15000);

      click('[data-testid="project-browser-profile-warm"]');
      const warmed = await waitFor(() => {
        const nextPanel = query('[data-testid="project-browser-profiles-panel"]');
        const detail = text('[data-testid="project-browser-profile-detail"]');
        const status = text('[data-testid="project-browser-profile-operation-status"]');
        const afterWarmCount = Number(nextPanel?.dataset.profileCount ?? 0);

        if (
          !status.includes("Profile storage prepared") ||
          !detail.includes("Preparation metadata present") ||
          !detail.includes("Ready")
        ) {
          return false;
        }

        return { detail, status, afterWarmCount };
      }, 15000);

      click('[data-testid="project-browser-profile-launch"]');
      const launchStatus = await waitFor(() => {
        const status = text('[data-testid="project-browser-profile-operation-status"]');

        if (!status.includes("Camoufox") && !status.includes("Browser provider")) {
          return false;
        }

        return status;
      }, 15000);

      return {
        hasElectrobun: Boolean(window.__electrobun),
        harnessTitle: text('[data-testid="project-browser-harness-title"]'),
        providerReadyCount: text('[data-testid="project-browser-provider-ready-count"]'),
        beforeCount,
        afterCreateCount: created.afterCount,
        afterWarmCount: warmed.afterWarmCount,
        createdRow: created.row,
        createdDetail: created.detail,
        verifiedDetail,
        warmedDetail: warmed.detail,
        launchStatus,
        registryStatus: created.status,
        storagePath: project.path,
      };
    `,
      45_000,
    ).then((result) => {
      expect(result.hasElectrobun).to.eq(true);
      expect(result.harnessTitle).to.eq(
        "Native browser profiles",
      );
      expect(result.providerReadyCount).to.contain("1/2 ready");
      expect(result.afterCreateCount).to.eq(result.beforeCount + 1);
      expect(result.afterWarmCount).to.eq(result.afterCreateCount);
      expect(result.createdRow).to.contain("Camoufox lane");
      expect(result.createdDetail).to.contain(".fptclaw");
      expect(result.verifiedDetail).to.contain("Profile storage verified");
      expect(result.warmedDetail).to.contain("Preparation metadata present");
      expect(result.registryStatus).to.contain("Profile storage created");
      expect(result.launchStatus).to.match(/Camoufox|Browser provider/);
      expect(result.storagePath).to.not.eq("");
    });
  });
});
