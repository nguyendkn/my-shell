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
    cy.get(selectors.row).first().should("contain.text", "001");

    cy.get(selectors.scroller).scrollTo(0, 1800, { duration: 0 });

    cy.get(selectors.row).first().should("not.contain.text", "001");
    cy.get(selectors.scroller).its("0.scrollTop").should("be.greaterThan", 0);
    getRenderedCount(selectors).then((count) => {
      cy.get(selectors.row).should("have.length", count);
      expect(count).to.be.lessThan(40);
    });
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
});
