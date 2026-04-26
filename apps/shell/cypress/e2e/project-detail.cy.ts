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

const CUSTOM_PROJECTS_STORAGE_KEY = "fptclaw.custom-projects.v1";
const TEST_PROJECT_ID = 1001;
const TEST_PROJECT_NAME = "FPTClaw Runtime Test";
const TEST_PROJECT_FOLDER = "D:/Projects/MyShell";
const TEST_PROJECT_ROUTE = `/projects/${TEST_PROJECT_ID}`;
const TEST_PROJECT = {
  id: TEST_PROJECT_ID,
  name: TEST_PROJECT_NAME,
  description: "Local project workspace opened from a selected folder.",
  owner: "Local workspace",
  folderPath: TEST_PROJECT_FOLDER,
  status: "Active",
  priority: "Medium",
  progress: 0,
  documents: 0,
  tasks: 0,
  updatedAt: "2026-04-26",
};

function visitTestProject(path = TEST_PROJECT_ROUTE) {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem(
        CUSTOM_PROJECTS_STORAGE_KEY,
        JSON.stringify([TEST_PROJECT]),
      );
    },
  });
}

describe("Project detail chat", () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    visitTestProject();
  });

  it("renders project detail from the route id with a chat-style layout", () => {
    cy.location("pathname").should("eq", TEST_PROJECT_ROUTE);
    cy.contains("h1", TEST_PROJECT_NAME).should("be.visible");
    cy.contains("Local project workspace opened from a selected folder.").should(
      "be.visible",
    );
    cy.contains(TEST_PROJECT_FOLDER).should("be.visible");
    cy.contains("Local folder linked").should("be.visible");
    cy.get('[data-testid="project-chat-scroller"]').should("be.visible");
    cy.get('[data-testid="project-chat-empty"]')
      .should("be.visible")
      .and("contain.text", "Runtime chat");
    cy.get('[data-testid="project-chat-message"]').should("not.exist");
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

  it("renders markdown and syntax-highlighted code fences in chat messages", () => {
    const markdown = [
      "### Parser check",
      "```python",
      "def greet(name):",
      "    return f\"hello {name}\"",
      "```",
      "```typescript",
      "const answer: number = 42",
      "```",
      "- **Markdown** list item",
    ].join("\n");

    cy.window().then((win) => {
      cy.get('[data-testid="project-chat-input"]').then(($input) => {
        const input = $input[0] as HTMLTextAreaElement;
        const valueSetter = Object.getOwnPropertyDescriptor(
          win.HTMLTextAreaElement.prototype,
          "value",
        )?.set;

        valueSetter?.call(input, markdown);
        input.dispatchEvent(new win.Event("input", { bubbles: true }));
      });
    });
    cy.get('[data-testid="project-chat-send"]').should("not.be.disabled").click();

    cy.get('[data-testid="project-chat-markdown"]')
      .last()
      .within(() => {
        cy.get("h3").should("contain.text", "Parser check");
        cy.get("strong").should("contain.text", "Markdown");
      });
    cy.get('[data-testid="project-chat-code-block"]').should("have.length", 2);
    cy.get('[data-testid="project-chat-code-language"]')
      .first()
      .should("contain.text", "Python");
    cy.get('[data-testid="project-chat-code-language"]')
      .eq(1)
      .should("contain.text", "TypeScript");
    cy.contains('[data-testid="project-chat-code-block"]', "def greet")
      .find(".hljs-keyword")
      .should("exist");

    cy.window().then((win) => {
      expect(
        win.document.documentElement.scrollWidth,
        "highlighted chat markdown avoids page-level horizontal overflow",
      ).to.be.lte(win.innerWidth);
    });
  });

  it("keeps the chat composer sticky at the fullscreen bottom edge", () => {
    cy.viewport(1920, 1080);
    visitTestProject();

    cy.get('[data-testid="project-chat-scroller"]').scrollTo("top", {
      ensureScrollable: false,
    });
    expectChatComposerPinnedToViewport();

    cy.get('[data-testid="project-side-panel-toggle"]').click();
    cy.get('[data-testid="project-side-panel-rail"]').should("be.visible");
    expectChatComposerPinnedToViewport();
  });

  it("keeps the project detail workspace inside the mobile viewport", () => {
    cy.viewport(390, 844);
    visitTestProject();

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
    visitTestProject();

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

  it("shows context mentions and inserts the linked project folder", () => {
    cy.get('[data-testid="project-chat-input"]').type("@");

    cy.get('[data-testid="project-context-menu"]').should("be.visible");
    cy.contains(
      '[data-testid="project-context-option"]',
      "Project folder",
    ).click();

    cy.get('[data-testid="project-chat-input"]').should(
      "have.value",
      `@${TEST_PROJECT_FOLDER} `,
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
    cy.get('[data-testid="project-terminal-toolbar"] button').then(
      ($buttons) => {
        expect($buttons.eq(0)).to.have.attr(
          "data-testid",
          "project-terminal-fullscreen",
        );
        expect($buttons.eq(1)).to.have.attr(
          "data-testid",
          "project-terminal-split",
        );
      },
    );
    cy.get('[data-testid="project-terminal-panel"]')
      .should("be.visible")
      .and("have.attr", "data-terminal-count", "1")
      .and("have.attr", "data-fullscreen", "false");
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

  it("shows browser profiles and creates a new Camoufox profile", () => {
    cy.get('[data-testid="project-workspace-tab-browser-profiles"]').click();

    cy.get('[data-testid="project-side-panel"]').should("not.exist");
    cy.get('[data-testid="project-browser-profiles-panel"]')
      .should("be.visible")
      .and("have.attr", "data-profile-count", "0");
    cy.get('[data-testid="project-browser-harness-title"]').should(
      "have.text",
      "Native browser profiles",
    );
    cy.get('[data-testid="project-browser-provider"]').should("have.length", 2);
    cy.get('[data-testid="project-browser-profile-empty"]')
      .should("be.visible")
      .and("contain.text", "No project browser profiles yet");
    cy.get('[data-testid="project-browser-profile-row"]').should("not.exist");
    cy.get('[data-testid="project-browser-profile-operation-status"]').should(
      "contain.text",
      "desktop mode",
    );

    cy.get('[data-testid="project-browser-profile-create"]').click();
    cy.get('[data-testid="project-browser-profiles-panel"]').should(
      "have.attr",
      "data-profile-count",
      "0",
    );
    cy.get('[data-testid="project-browser-profile-operation-status"]').should(
      "contain.text",
      "Native browser profile bridge",
    );
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
      `Update ${TEST_PROJECT_NAME} handoff`,
    );
  });
});
