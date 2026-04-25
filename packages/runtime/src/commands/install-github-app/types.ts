// Workflow identifier — the install-github-app flow ships two preset
// workflows (claude / claude-review). Kept open via the string fallback so
// future presets don't require a type change.
export type Workflow = "claude" | "claude-review" | string;

// Setup warnings surfaced in the install UI (e.g. existing secret name
// collision). Loose shape because every warning carries a different
// payload.
export type Warning = {
  type?: string;
  message?: string;
  [key: string]: unknown;
};

// Persisted setup state across the multi-step install wizard. Loose by
// design — survives schema bumps without touching the type.
export type State = {
  step?: string;
  selectedWorkflows?: Workflow[];
  apiKeyOrOAuthToken?: string;
  secretName?: string;
  secretExists?: boolean;
  warnings?: Warning[];
  [key: string]: unknown;
};
