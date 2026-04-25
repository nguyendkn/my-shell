/// <reference types="cypress" />

function expectTerminalPanesInsideViewport() {
  cy.window().then((win) => {
    const viewportHeight = win.innerHeight;

    cy.get('[data-testid="project-terminal-split-view"]').then(($splitView) => {
      const splitViewRect = $splitView[0].getBoundingClientRect();

      expect(
        splitViewRect.bottom,
        "split view stays inside app viewport",
      ).to.be.lte(viewportHeight);

      cy.get('[data-testid="project-terminal-pane"]').each(($pane) => {
        const paneRect = $pane[0].getBoundingClientRect();

        expect(
          paneRect.bottom,
          "terminal pane stays inside split view",
        ).to.be.lt(splitViewRect.bottom);
        expect(
          splitViewRect.bottom - paneRect.bottom,
          "terminal split view keeps bottom padding",
        ).to.be.gte(12);
      });
    });
  });
}

function expectChatComposerPinnedToViewport() {
  cy.window().then((win) => {
    const viewportHeight = win.innerHeight;

    cy.get('[data-testid="project-chat-composer"]').then(($composer) => {
      const composerRect = $composer[0].getBoundingClientRect();

      expect(
        composerRect.bottom,
        "chat composer sticks to the viewport bottom",
      ).to.be.closeTo(viewportHeight, 1);
      expect(composerRect.top, "composer remains visible").to.be.lessThan(
        viewportHeight,
      );

      cy.get('[data-testid="project-chat-shell"]').then(($shell) => {
        const shellRect = $shell[0].getBoundingClientRect();

        expect(
          shellRect.bottom,
          "chat shell fills the available viewport height",
        ).to.be.closeTo(viewportHeight, 1);
      });

      cy.get('[data-testid="project-chat-scroller"]').then(($scroller) => {
        const scrollerRect = $scroller[0].getBoundingClientRect();

        expect(
          scrollerRect.bottom,
          "chat scroller ends where the composer begins",
        ).to.be.closeTo(composerRect.top, 1);
      });
    });
  });
}

describe("Project detail chat", () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.visit("/projects/1");
  });

  it("renders project detail from the route id with a chat-style layout", () => {
    cy.location("pathname").should("eq", "/projects/1");
    cy.contains("h1", "FPTClaw Workspace 001").should("be.visible");
    cy.contains("Prepare FPTClaw Workspace 001 for reviewer handoff").should(
      "be.visible",
    );
    cy.get('[data-testid="project-chat-scroller"]').should("be.visible");
    cy.get('[data-testid="project-chat-message"]').should(
      "have.length.greaterThan",
      4,
    );
    cy.get('[data-testid="project-chat-scroller"]')
      .scrollTo("bottom")
      .should("contain.text", "Should I prioritize reviewer comments first");
  });

  it("appends a sent message to the project chat", () => {
    cy.get('[data-testid="project-chat-input"]').type(
      "Summarize the next reviewer handoff.",
    );
    cy.get('[data-testid="project-chat-send"]').click();

    cy.get('[data-testid="project-chat-message"]')
      .last()
      .should("contain.text", "Summarize the next reviewer handoff.");

    cy.get('[data-testid="project-side-panel-toggle"]').click();
    cy.get('[data-testid="project-chat-message"]')
      .last()
      .should("contain.text", "Summarize the next reviewer handoff.");
  });

  it("keeps the chat composer sticky at the fullscreen bottom edge", () => {
    cy.viewport(1920, 1080);
    cy.visit("/projects/1");

    cy.get('[data-testid="project-chat-scroller"]').scrollTo("top");
    expectChatComposerPinnedToViewport();

    cy.get('[data-testid="project-side-panel-toggle"]').click();
    cy.get('[data-testid="project-side-panel-rail"]').should("be.visible");
    expectChatComposerPinnedToViewport();
  });

  it("keeps the project detail workspace inside the mobile viewport", () => {
    cy.viewport(390, 844);
    cy.visit("/projects/1");

    cy.window().then((win) => {
      expect(
        win.document.documentElement.scrollWidth,
        "project detail has no horizontal document overflow",
      ).to.be.lte(win.innerWidth);
    });

    cy.get('[data-testid="project-chat-composer"]').then(($composer) => {
      const rect = $composer[0].getBoundingClientRect();

      expect(rect.right, "composer stays inside mobile viewport").to.be.lte(
        390,
      );
    });
  });

  it("opens project inspector features from the mobile detail header", () => {
    cy.viewport(390, 844);
    cy.visit("/projects/1");

    cy.get('[data-testid="project-side-panel"]').should("not.exist");
    cy.get('[data-testid="project-side-panel-toggle"]').click();
    cy.get('[data-testid="project-side-panel-sheet"]').should("be.visible");
    cy.get('[data-testid="project-side-panel"]').should("be.visible");

    cy.contains('[data-slot="tabs-trigger"]', "Files").click();
    cy.get('[data-testid="project-files-panel"]').should("be.visible");

    cy.get('[data-testid="project-side-panel-close"]').click();
    cy.get('[data-testid="project-side-panel-sheet"]').should("not.exist");
  });

  it("shows slash commands and inserts the selected workflow", () => {
    cy.get('[data-testid="project-chat-input"]').type("/vk:fi");

    cy.get('[data-testid="project-slash-menu"]').should("be.visible");
    cy.contains('[data-testid="project-slash-option"]', "/vk:fix").click();

    cy.get('[data-testid="project-chat-input"]').should(
      "have.value",
      "/vk:fix ",
    );
  });

  it("shows context mentions and inserts a project file reference", () => {
    cy.get('[data-testid="project-chat-input"]').type("@");

    cy.get('[data-testid="project-context-menu"]').should("be.visible");
    cy.contains('[data-testid="project-context-option"]', "File").click();
    cy.contains(
      '[data-testid="project-context-option"]',
      "FPTClaw Workspace 001 source brief.pdf",
    ).click();

    cy.get('[data-testid="project-chat-input"]').should(
      "have.value",
      "@/projects/001/raw/source-brief.pdf ",
    );
  });

  it("shows selected attachments and sends attachment-only messages", () => {
    cy.get('[data-testid="project-chat-file-input"]').selectFile(
      {
        contents: Cypress.Buffer.from("# Reviewer notes"),
        fileName: "reviewer-notes.md",
        mimeType: "text/markdown",
      },
      { force: true },
    );

    cy.get('[data-testid="project-chat-attachment"]').should(
      "contain.text",
      "reviewer-notes.md",
    );
    cy.get('[data-testid="project-chat-send"]').click();

    cy.get('[data-testid="project-chat-message"]')
      .last()
      .should("contain.text", "Attached files");
    cy.get('[data-testid="project-message-attachment"]')
      .last()
      .should("contain.text", "reviewer-notes.md");
  });

  it("opens terminal management and splits terminals evenly", () => {
    cy.viewport(1280, 720);

    cy.get('[data-testid="project-terminal-toolbar"]').should("not.exist");
    cy.get('[data-testid="project-side-panel"]').should("be.visible");

    cy.get('[data-testid="project-workspace-tab-terminal"]').click();

    cy.get('[data-testid="project-side-panel"]').should("not.exist");
    cy.get('[data-testid="project-side-panel-rail"]').should("be.visible");
    cy.get('[data-testid="project-terminal-toolbar"]').should("be.visible");
    cy.get('[data-testid="project-terminal-panel"]')
      .should("be.visible")
      .and("have.attr", "data-terminal-count", "1");
    cy.get('[data-testid="project-terminal-pane"]').should("have.length", 1);
    cy.get('[data-testid="project-terminal-close"]').should("be.disabled");
    expectTerminalPanesInsideViewport();

    cy.get('[data-testid="project-terminal-split"]').click();
    cy.get('[data-testid="project-terminal-panel"]').should(
      "have.attr",
      "data-terminal-count",
      "2",
    );
    cy.get('[data-testid="project-terminal-pane"]').should("have.length", 2);

    cy.get('[data-testid="project-terminal-add"]').click();
    cy.get('[data-testid="project-terminal-panel"]').should(
      "have.attr",
      "data-terminal-count",
      "3",
    );
    cy.get('[data-testid="project-terminal-pane"]').should("have.length", 3);
    expectTerminalPanesInsideViewport();

    cy.get('[data-testid="project-terminal-pane"]')
      .eq(1)
      .find('[data-testid="project-terminal-close"]')
      .click();

    cy.get('[data-testid="project-terminal-panel"]').should(
      "have.attr",
      "data-terminal-count",
      "2",
    );
    cy.get('[data-testid="project-terminal-pane"]').should("have.length", 2);
  });

  it("returns to the virtualized project list", () => {
    cy.get('[data-testid="project-detail-back"]').click();

    cy.location("pathname").should("eq", "/projects");
    cy.get('[data-testid="projects-scroller"]').should("be.visible");
  });

  it("collapses the app sidebar on detail and reopens it after leaving detail", () => {
    cy.get('[data-testid="app-sidebar"]')
      .closest('[data-slot="sidebar"]')
      .should("have.attr", "data-state", "collapsed");

    cy.get('[data-testid="project-detail-back"]').click();

    cy.location("pathname").should("eq", "/projects");
    cy.get('[data-testid="app-sidebar"]')
      .closest('[data-slot="sidebar"]')
      .should("have.attr", "data-state", "expanded");

    cy.contains('[data-slot="sidebar-menu-button"]', "Dashboard").click();

    cy.location("pathname").should("eq", "/dashboard");
    cy.get('[data-testid="app-sidebar"]')
      .closest('[data-slot="sidebar"]')
      .should("have.attr", "data-state", "expanded");
  });

  it("toggles the project right sidebar", () => {
    cy.get('[data-testid="project-side-panel"]').should("be.visible");
    cy.get('[data-testid="project-wiki-panel"]').should("be.visible");
    cy.get('[data-testid="project-side-panel-close"]').click();

    cy.get('[data-testid="project-side-panel"]').should("not.exist");
    cy.get('[data-testid="project-side-panel-rail"]').should("be.visible");
    cy.get(
      '[data-testid="project-side-panel-rail"] button[data-testid^="project-side-panel-rail-"]',
    ).should("have.length", 5);

    cy.get('[data-testid="project-side-panel-rail-files"]').trigger(
      "mouseover",
    );
    cy.get('[data-testid="project-side-panel-rail-popover-files"]')
      .should("be.visible")
      .and("contain.text", "Raw sources");

    cy.get('[data-testid="project-side-panel-rail-files"]').click();

    cy.get('[data-testid="project-side-panel"]').should("be.visible");
    cy.get('[data-testid="project-files-panel"]').should("be.visible");
  });

  it("shows project wiki operations, layers, and health signals", () => {
    cy.get('[data-testid="project-wiki-panel"]').should("be.visible");
    cy.contains("Raw sources").should("be.visible");
    cy.contains("Human approval before wiki writes").should("be.visible");
    cy.contains("index.md").scrollIntoView().should("be.visible");
    cy.contains("Run lint").scrollIntoView().should("be.visible");
    cy.contains("Contradictions").scrollIntoView().should("be.visible");
  });

  it("shows project file management with filters and file visibility", () => {
    cy.contains('[data-slot="tabs-trigger"]', "Files").click();

    cy.get('[data-testid="project-files-panel"]').should("be.visible");
    cy.get('[data-testid="project-file-row"]').should(
      "have.length.greaterThan",
      4,
    );

    cy.get('[data-testid="project-file-search"]').type("review");
    cy.get('[data-testid="project-file-row"]').should("contain.text", "review");

    cy.contains('[data-slot="toggle-group-item"]', "Raw").click();
    cy.get('[data-testid="project-file-row"]').should("contain.text", "Raw");
  });

  it("shows git changes, a CodeMirror diff, and AI commit message generation", () => {
    cy.contains('[data-slot="tabs-trigger"]', "Git").click();

    cy.get('[data-testid="project-git-change"]').should(
      "have.length.greaterThan",
      2,
    );
    cy.get('[data-testid="project-code-viewer"] .cm-editor').should(
      "be.visible",
    );

    cy.get('[data-testid="project-git-ai-message"]').click();
    cy.get('[data-testid="project-git-commit-message"]').should(
      "contain.value",
      "Update FPTClaw Workspace 001 handoff",
    );
  });
});
