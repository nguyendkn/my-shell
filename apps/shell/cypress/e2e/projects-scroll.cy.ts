/// <reference types="cypress" />

import {
  getLoadedCount,
  getRenderedCount,
  loadUntil,
  scrollPastLoadThreshold,
  shouldHaveLoadedCount,
  type VirtualListSelectors,
} from "@repo/cypress/virtual-list";

const selectors: VirtualListSelectors = {
  scroller: '[data-testid="projects-scroller"]',
  list: '[data-testid="projects-list"]',
  row: '[data-testid="project-row"]',
};

describe("Projects virtual infinite scroll", () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.clearLocalStorage("fptclaw.custom-projects.v1");
    cy.visit("/projects");
    cy.get(selectors.scroller).should("be.visible");
  });

  it("virtualizes the initial project rows instead of rendering the loaded batch", () => {
    getLoadedCount(selectors).should("eq", 40);

    cy.get(selectors.row).then(($rows) => {
      expect($rows.length).to.be.greaterThan(0);
      expect($rows.length).to.be.lessThan(40);
    });

    getRenderedCount(selectors).then((count) => {
      cy.get(selectors.row).should("have.length", count);
    });

    cy.get(selectors.scroller).then(($scroller) => {
      const scroller = $scroller[0];

      expect(scroller.scrollHeight).to.be.greaterThan(scroller.clientHeight);
    });
  });

  it("updates the visible virtual window while scrolling", () => {
    let firstRowText = "";

    cy.get(selectors.row)
      .first()
      .invoke("text")
      .then((text) => {
        firstRowText = text;
      });

    cy.get(selectors.scroller).scrollTo(0, 1800, { duration: 0 });

    cy.get(selectors.row)
      .first()
      .invoke("text")
      .should((text) => {
        expect(text).not.to.eq(firstRowText);
      });
    cy.get(selectors.scroller).its("0.scrollTop").should("be.greaterThan", 0);
    getRenderedCount(selectors).then((count) => {
      cy.get(selectors.row).should("have.length", count);
      expect(count).to.be.lessThan(40);
    });
  });

  it("keeps compact project rows separated on mobile", () => {
    cy.viewport(390, 844);
    cy.visit("/projects");

    cy.get(selectors.row).then(($rows) => {
      const rects = [...$rows].map((row) => row.getBoundingClientRect());

      rects.slice(1).forEach((rect, index) => {
        expect(
          rect.top,
          `project row ${index + 1} does not overlap the previous row`,
        ).to.be.gte(rects[index].bottom);
      });
    });
  });

  it("filters projects and opens a focused row with the keyboard", () => {
    cy.get('[data-testid="projects-search"]').type("proposal automation 002");
    cy.get(selectors.row).should("have.length", 1);
    cy.get(selectors.row).first().should("contain.text", "Proposal Automation");

    cy.get(selectors.row).first().focus().type("{enter}");

    cy.location("pathname").should("eq", "/projects/2");
  });

  it("shows an empty state when project filters have no results", () => {
    cy.get('[data-testid="projects-search"]').type("not-a-real-project");

    cy.contains("No projects match the current filters.").should("be.visible");
    cy.get(selectors.row).should("not.exist");
  });

  it("lazy loads the next page after scrolling past 75 percent", () => {
    scrollPastLoadThreshold(selectors);

    shouldHaveLoadedCount(selectors, 80);
    getRenderedCount(selectors).then((count) => {
      expect(count).to.be.lessThan(80);
    });
  });

  it("continues infinite loading to the end while keeping the DOM virtualized", () => {
    loadUntil(selectors, 1000);

    shouldHaveLoadedCount(selectors, 1000);
    cy.get(selectors.scroller).scrollTo("bottom", { duration: 0 });
    cy.contains("End of project list").should("be.visible");

    getRenderedCount(selectors).then((count) => {
      expect(count).to.be.lessThan(40);
      cy.get(selectors.row).should("have.length", count);
    });
  });

  it("creates a project from a folder path and opens project detail", () => {
    cy.get('[data-testid="project-create-open"]').click();

    cy.get('[data-testid="project-create-path"]').type(
      "D:\\Projects\\FPTClaw",
      { parseSpecialCharSequences: false },
    );
    cy.get('[data-testid="project-create-name"]').should(
      "have.value",
      "FPTClaw",
    );
    cy.get('[data-testid="project-create-submit"]').click();

    cy.location("pathname").should("eq", "/projects/1001");
    cy.contains("h1", "FPTClaw").should("be.visible");
    cy.contains("D:\\Projects\\FPTClaw").should("be.visible");
  });
});
