export type VirtualListSelectors = {
  scroller: string;
  list: string;
  row: string;
};

export type VirtualListAttributes = {
  loadedCount: string;
  renderedCount: string;
};

const defaultAttributes: VirtualListAttributes = {
  loadedCount: "data-loaded-count",
  renderedCount: "data-rendered-count",
};

export function getVirtualListCount(
  selector: string,
  attribute: keyof VirtualListAttributes,
  attributes: Partial<VirtualListAttributes> = {},
) {
  const resolvedAttributes = { ...defaultAttributes, ...attributes };

  return cy
    .get(selector)
    .invoke("attr", resolvedAttributes[attribute])
    .then((value) => Number(value));
}

export function getLoadedCount(
  selectors: Pick<VirtualListSelectors, "list">,
  attributes?: Partial<VirtualListAttributes>,
) {
  return getVirtualListCount(selectors.list, "loadedCount", attributes);
}

export function getRenderedCount(
  selectors: Pick<VirtualListSelectors, "list">,
  attributes?: Partial<VirtualListAttributes>,
) {
  return getVirtualListCount(selectors.list, "renderedCount", attributes);
}

export function shouldHaveVirtualListCount(
  selector: string,
  attribute: keyof VirtualListAttributes,
  assertion: (count: number) => void,
  attributes: Partial<VirtualListAttributes> = {},
) {
  const resolvedAttributes = { ...defaultAttributes, ...attributes };

  return cy.get(selector).should(($list) => {
    assertion(Number($list.attr(resolvedAttributes[attribute])));
  });
}

export function shouldHaveLoadedCount(
  selectors: Pick<VirtualListSelectors, "list">,
  expectedCount: number,
  attributes?: Partial<VirtualListAttributes>,
) {
  return shouldHaveVirtualListCount(
    selectors.list,
    "loadedCount",
    (count) => expect(count).to.eq(expectedCount),
    attributes,
  );
}

export function shouldHaveLoadedCountGreaterThan(
  selectors: Pick<VirtualListSelectors, "list">,
  minimumCount: number,
  attributes?: Partial<VirtualListAttributes>,
) {
  return shouldHaveVirtualListCount(
    selectors.list,
    "loadedCount",
    (count) => expect(count).to.be.greaterThan(minimumCount),
    attributes,
  );
}

export function scrollPastLoadThreshold(
  selectors: Pick<VirtualListSelectors, "scroller">,
  threshold = 0.8,
) {
  cy.get(selectors.scroller).then(($scroller) => {
    const scroller = $scroller[0];

    expect(scroller, "virtual list scroller").to.exist;

    if (!scroller) {
      return;
    }

    const top = Math.max(
      0,
      Math.ceil(scroller.scrollHeight * threshold - scroller.clientHeight),
    );

    cy.wrap($scroller).scrollTo(0, top, { duration: 0 });
  });
}

export function loadUntil(
  selectors: Pick<VirtualListSelectors, "list" | "scroller">,
  targetCount: number,
  threshold = 0.8,
): Cypress.Chainable<undefined> {
  return getLoadedCount(selectors).then(
    (before): Cypress.Chainable<undefined> => {
      if (before >= targetCount) {
        return cy.wrap(undefined, { log: false });
      }

      scrollPastLoadThreshold(selectors, threshold);

      return shouldHaveLoadedCountGreaterThan(selectors, before).then(
        (): Cypress.Chainable<undefined> =>
          loadUntil(selectors, targetCount, threshold),
      );
    },
  );
}
