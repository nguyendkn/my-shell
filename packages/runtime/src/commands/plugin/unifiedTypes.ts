// Loose types for the unified plugin/MCP catalog. Concrete shapes are
// validated at the I/O boundary; the renderer just reads optional fields.

export type UnifiedMarketplaceItem = Record<string, unknown>;
export type UnifiedInstalledPlugin = Record<string, unknown>;

// A unified row in the "installed" tab — covers both plugins and standalone
// MCPs. Carries the common display fields the list renderer reads; concrete
// payload (config / source / failure metadata) lives in the indexed tail.
export type UnifiedInstalledItem = {
  type?: string;
  id?: string;
  name: string;
  scope: string;
  description?: string;
  status?: string;
  indented?: boolean;
  [key: string]: unknown;
};
