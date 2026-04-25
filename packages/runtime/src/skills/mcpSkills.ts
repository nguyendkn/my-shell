// MCP skills loader. Memoized in the real impl so tools/skills don't get
// re-fetched on every connection use; the restored runtime returns []
// regardless of input. Exposes a cache surface matching memoizeWithLRU so
// services/mcp/client can call .cache.delete(name) on reconnect.

const noopCache = {
  clear: (): void => {},
  size: (): number => 0,
  delete: (_key: string): boolean => true,
  get: (_key: string): unknown => undefined,
  has: (_key: string): boolean => false,
};

export const fetchMcpSkillsForClient = Object.assign(
  async (_client: unknown): Promise<unknown[]> => {
    return [];
  },
  { cache: noopCache },
);
