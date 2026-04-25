import { projects, type Project } from "./projects";

export type ProjectChatMessageKind =
  | "text"
  | "reasoning"
  | "tool"
  | "checkpoint"
  | "question";

export type ProjectChatMessageRole = "assistant" | "system" | "user";

export type ProjectChatMessageAction =
  | string
  | {
      id: string;
      label: string;
      variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
      disabled?: boolean;
      pending?: boolean;
      title?: string;
    };

export type ProjectChatMessage = {
  id: string;
  role: ProjectChatMessageRole;
  kind: ProjectChatMessageKind;
  title?: string;
  body: string;
  time: string;
  status?: "complete" | "pending" | "running" | "failed" | "canceled";
  files?: string[];
  actions?: ProjectChatMessageAction[];
  runtimeSessionId?: string;
  runtimeTurnId?: string;
  runtimePermissionRequestId?: string;
  runtimePermissionToolName?: string;
};

export type ProjectResource = {
  name: string;
  type: "Brief" | "Dataset" | "Draft" | "Workspace";
  updatedAt: string;
};

export type ProjectWikiLayer = {
  id: string;
  name: string;
  directory: string;
  role: string;
  itemCount: number;
  state: "immutable" | "maintained" | "governed";
};

export type ProjectWikiOperation = {
  id: string;
  label: string;
  target: string;
  status: "ready" | "running" | "queued";
  lastRun: string;
};

export type ProjectWikiPage = {
  id: string;
  title: string;
  path: string;
  type:
    | "Overview"
    | "Entity"
    | "Concept"
    | "Source Summary"
    | "Synthesis"
    | "Question";
  subtype: string;
  updatedAt: string;
  citations: number;
  backlinks: number;
  status: "current" | "needs-review" | "stale" | "draft";
  summary: string;
};

export type ProjectWikiHealthItem = {
  id: string;
  label: string;
  count: number;
  severity: "good" | "warning" | "danger";
  action: string;
};

export type ProjectWikiSpecialFile = {
  id: string;
  name: string;
  path: string;
  purpose: string;
  updatedAt: string;
};

export type ProjectWikiState = {
  sourceCount: number;
  pageCount: number;
  citationCoverage: number;
  reviewQueue: number;
  layers: ProjectWikiLayer[];
  operations: ProjectWikiOperation[];
  pages: ProjectWikiPage[];
  health: ProjectWikiHealthItem[];
  specialFiles: ProjectWikiSpecialFile[];
};

export type ProjectFileKind = "raw" | "wiki" | "schema" | "log" | "asset";

export type ProjectFileAsset = {
  id: string;
  name: string;
  path: string;
  kind: ProjectFileKind;
  type: "PDF" | "Markdown" | "Web" | "Image" | "Dataset" | "Config";
  status: "ready" | "needs-ingest" | "draft" | "approved" | "blocked";
  updatedAt: string;
  size: string;
  citations: number;
  linkedPages: number;
  sensitive: boolean;
  llmVisible: boolean;
  immutable: boolean;
  summary: string;
};

export type ProjectFileState = {
  inboxCount: number;
  reviewCount: number;
  storageUsed: string;
  files: ProjectFileAsset[];
};

export type ProjectTimelineItem = {
  label: string;
  time: string;
  state: "done" | "current" | "queued";
};

export type ProjectGitChangeStatus = "modified" | "added" | "deleted";

export type ProjectGitChange = {
  id: string;
  path: string;
  status: ProjectGitChangeStatus;
  additions: number;
  deletions: number;
  summary: string;
  diff: string;
};

export type ProjectGitState = {
  baseBranch: string;
  ahead: number;
  behind: number;
  changes: ProjectGitChange[];
  commitMessage: string;
};

export type ProjectBrowserProviderId = "camoufox" | "chrome-cdp";

export type ProjectBrowserProviderStatus = "ready" | "planned";

export type ProjectBrowserProvider = {
  id: ProjectBrowserProviderId;
  name: string;
  engine: string;
  transport: string;
  status: ProjectBrowserProviderStatus;
  setupCommand: string;
  description: string;
  capabilities: string[];
  constraints: string[];
};

export type ProjectBrowserProfileStatus =
  | "ready"
  | "warming"
  | "running"
  | "needs-setup";

export type ProjectBrowserProfile = {
  id: string;
  name: string;
  providerId: ProjectBrowserProviderId;
  status: ProjectBrowserProfileStatus;
  profilePath: string;
  proxyLane: string;
  locale: string;
  timezone: string;
  os: "windows" | "macos" | "linux";
  headless: "headed" | "headless" | "virtual";
  persistentContext: boolean;
  harnessMode: "playwright" | "cdp";
  endpoint: string;
  lastUsed: string;
  health: number;
  cookieJar: string;
  targetDomains: string[];
  tags: string[];
  notes: string;
};

export type ProjectBrowserHarnessState = {
  agent: "Hermes Agent";
  outcome: "Local AGI";
  skillRoot: string;
  helperPolicy: string;
  domainSkills: number;
  cdpUrl: string | null;
  notes: string[];
};

export type ProjectBrowserState = {
  defaultProviderId: ProjectBrowserProviderId;
  providers: ProjectBrowserProvider[];
  profiles: ProjectBrowserProfile[];
  harness: ProjectBrowserHarnessState;
};

export type ProjectDetail = {
  project: Project;
  activeTask: string;
  branch: string;
  contextUsed: number;
  contextLimit: number;
  environment: "Local" | "Staging" | "Production";
  model: string;
  mode: "Plan" | "Act";
  messages: ProjectChatMessage[];
  resources: ProjectResource[];
  wiki: ProjectWikiState;
  files: ProjectFileState;
  timeline: ProjectTimelineItem[];
  git: ProjectGitState;
  browser: ProjectBrowserState;
};

const modelNames = [
  "FPTClaw Agent / Planner",
  "FPTClaw Agent / Builder",
  "FPTClaw Agent / Reviewer",
];

const environments: ProjectDetail["environment"][] = [
  "Local",
  "Staging",
  "Production",
];

function pick<T>(items: T[], index: number) {
  return items[index % items.length] as T;
}

function getProjectRoot(project: Project) {
  return (
    project.folderPath ?? `projects/${String(project.id).padStart(3, "0")}`
  );
}

function makeMessages(project: Project): ProjectChatMessage[] {
  const shortName = project.name.replace(/\s\d+$/, "");

  return [
    {
      id: `${project.id}-task`,
      role: "user",
      kind: "text",
      title: "Initial task",
      body: `Prepare the next project pass for ${project.name}. Focus on open tasks, high-impact documents, and reviewer handoff.`,
      time: "09:12",
      files: ["proposal-outline.md", "review-notes.md"],
    },
    {
      id: `${project.id}-thinking`,
      role: "assistant",
      kind: "reasoning",
      title: "Planning",
      body: `I am checking the project context first: owner, stale documents, unresolved tasks, and the latest ${shortName} review notes.`,
      time: "09:13",
      status: "complete",
    },
    {
      id: `${project.id}-tool-docs`,
      role: "system",
      kind: "tool",
      title: "Read project files",
      body: "Scanned 12 project documents and grouped the active work into scope, evidence, review, and delivery lanes.",
      time: "09:14",
      status: "complete",
      actions: ["12 docs", "4 lanes", "2 stale files"],
    },
    {
      id: `${project.id}-assistant-plan`,
      role: "assistant",
      kind: "text",
      title: "Project pass",
      body: `The useful next move is to close the evidence gaps before editing the proposal draft. I would start with the ${project.priority.toLowerCase()} priority items tied to reviewer feedback, then refresh the task owner list.`,
      time: "09:16",
      status: "complete",
    },
    {
      id: `${project.id}-checkpoint`,
      role: "system",
      kind: "checkpoint",
      title: "Checkpoint created",
      body: "Saved a project snapshot before applying the next set of task changes.",
      time: "09:17",
      status: "complete",
    },
    {
      id: `${project.id}-question`,
      role: "assistant",
      kind: "question",
      title: "Review choice",
      body: "Should I prioritize reviewer comments first, or assemble the missing source documents before drafting?",
      time: "09:18",
      status: "pending",
      actions: ["Reviewer comments", "Source documents"],
    },
  ];
}

function makeResources(project: Project): ProjectResource[] {
  return [
    {
      name: `${project.name} brief`,
      type: "Brief",
      updatedAt: project.updatedAt,
    },
    {
      name: "Reviewer evidence matrix",
      type: "Dataset",
      updatedAt: "2026-04-22",
    },
    {
      name: "Proposal working draft",
      type: "Draft",
      updatedAt: "2026-04-21",
    },
    {
      name: "Shared workspace notes",
      type: "Workspace",
      updatedAt: "2026-04-20",
    },
  ];
}

function makeWikiState(project: Project): ProjectWikiState {
  const rootPath = getProjectRoot(project);
  const pageCount = 18 + (project.id % 9);
  const sourceCount = project.documents;
  const reviewQueue = 2 + (project.id % 4);
  const citationCoverage = 78 + (project.id % 16);

  return {
    sourceCount,
    pageCount,
    citationCoverage,
    reviewQueue,
    layers: [
      {
        id: `${project.id}-raw`,
        name: "Raw sources",
        directory: `${rootPath}/raw`,
        role: "Curated source of truth",
        itemCount: sourceCount,
        state: "immutable",
      },
      {
        id: `${project.id}-wiki`,
        name: "Wiki",
        directory: `${rootPath}/wiki`,
        role: "LLM-maintained markdown",
        itemCount: pageCount,
        state: "maintained",
      },
      {
        id: `${project.id}-schema`,
        name: "Schema",
        directory: `${rootPath}/AGENTS.md`,
        role: "Conventions, workflows, review rules",
        itemCount: 1,
        state: "governed",
      },
    ],
    operations: [
      {
        id: `${project.id}-ingest`,
        label: "Ingest",
        target: "raw/inbox",
        status: "ready",
        lastRun: project.updatedAt,
      },
      {
        id: `${project.id}-query`,
        label: "Query",
        target: "wiki/index.md",
        status: "ready",
        lastRun: "09:18",
      },
      {
        id: `${project.id}-lint`,
        label: "Lint",
        target: "links, claims, stale pages",
        status: "queued",
        lastRun: "Yesterday",
      },
      {
        id: `${project.id}-file-answer`,
        label: "File answer",
        target: "wiki/questions",
        status: "ready",
        lastRun: "09:16",
      },
    ],
    pages: [
      {
        id: `${project.id}-overview`,
        title: `${project.name} overview`,
        path: `wiki/overview.md`,
        type: "Overview",
        subtype: "Current state",
        updatedAt: project.updatedAt,
        citations: 14,
        backlinks: 9,
        status: "current",
        summary:
          "Maintains the project thesis, scope, open risks, and next review lane.",
      },
      {
        id: `${project.id}-reviewer`,
        title: `${project.owner}`,
        path: `wiki/entities/${project.owner.toLowerCase().replaceAll(" ", "-")}.md`,
        type: "Entity",
        subtype: "Person",
        updatedAt: "2026-04-23",
        citations: 8,
        backlinks: 12,
        status: "needs-review",
        summary:
          "Collects reviewer preferences, decisions, and pending follow-ups.",
      },
      {
        id: `${project.id}-evidence`,
        title: "Evidence matrix",
        path: "wiki/concepts/evidence-matrix.md",
        type: "Concept",
        subtype: "Traceability",
        updatedAt: "2026-04-22",
        citations: 21,
        backlinks: 16,
        status: "current",
        summary:
          "Maps source documents to claims, gaps, and proposal sections.",
      },
      {
        id: `${project.id}-handoff`,
        title: "Reviewer handoff synthesis",
        path: "wiki/synthesis/reviewer-handoff.md",
        type: "Synthesis",
        subtype: "Decision brief",
        updatedAt: "2026-04-21",
        citations: 17,
        backlinks: 7,
        status: "draft",
        summary:
          "Combines recent questions, source changes, and proposed next edits.",
      },
    ],
    health: [
      {
        id: `${project.id}-claims`,
        label: "Cited claims",
        count: citationCoverage,
        severity: "good",
        action: "Keep",
      },
      {
        id: `${project.id}-orphans`,
        label: "Orphan pages",
        count: 3 + (project.id % 3),
        severity: "warning",
        action: "Link",
      },
      {
        id: `${project.id}-stale`,
        label: "Stale summaries",
        count: 1 + (project.id % 2),
        severity: "warning",
        action: "Refresh",
      },
      {
        id: `${project.id}-conflicts`,
        label: "Contradictions",
        count: project.id % 2,
        severity: project.id % 2 === 0 ? "good" : "danger",
        action: "Resolve",
      },
    ],
    specialFiles: [
      {
        id: `${project.id}-index`,
        name: "index.md",
        path: "wiki/index.md",
        purpose: "Content catalog",
        updatedAt: project.updatedAt,
      },
      {
        id: `${project.id}-log`,
        name: "log.md",
        path: "wiki/log.md",
        purpose: "Append-only activity",
        updatedAt: "09:18",
      },
      {
        id: `${project.id}-schema-file`,
        name: "AGENTS.md",
        path: `${rootPath}/AGENTS.md`,
        purpose: "Wiki maintainer contract",
        updatedAt: "2026-04-20",
      },
    ],
  };
}

function makeFileState(project: Project): ProjectFileState {
  const rootPath = getProjectRoot(project);

  return {
    inboxCount: 4 + (project.id % 4),
    reviewCount: 2 + (project.id % 3),
    storageUsed: `${1.2 + (project.id % 6) * 0.4} GB`,
    files: [
      {
        id: `${project.id}-source-brief`,
        name: `${project.name} source brief.pdf`,
        path: `${rootPath}/raw/source-brief.pdf`,
        kind: "raw",
        type: "PDF",
        status: "ready",
        updatedAt: project.updatedAt,
        size: "4.8 MB",
        citations: 12,
        linkedPages: 5,
        sensitive: false,
        llmVisible: true,
        immutable: true,
        summary:
          "Primary source packet used by the overview and evidence pages.",
      },
      {
        id: `${project.id}-clip`,
        name: "market-notes.web.md",
        path: `${rootPath}/raw/inbox/market-notes.web.md`,
        kind: "raw",
        type: "Web",
        status: "needs-ingest",
        updatedAt: "2026-04-24",
        size: "92 KB",
        citations: 0,
        linkedPages: 0,
        sensitive: false,
        llmVisible: true,
        immutable: true,
        summary:
          "New clipped source waiting for extraction and cross-reference updates.",
      },
      {
        id: `${project.id}-overview-file`,
        name: "overview.md",
        path: `${rootPath}/wiki/overview.md`,
        kind: "wiki",
        type: "Markdown",
        status: "approved",
        updatedAt: project.updatedAt,
        size: "18 KB",
        citations: 14,
        linkedPages: 9,
        sensitive: false,
        llmVisible: true,
        immutable: false,
        summary:
          "Project state page maintained from source changes and answered questions.",
      },
      {
        id: `${project.id}-handoff-file`,
        name: "reviewer-handoff.md",
        path: `${rootPath}/wiki/synthesis/reviewer-handoff.md`,
        kind: "wiki",
        type: "Markdown",
        status: "draft",
        updatedAt: "2026-04-21",
        size: "11 KB",
        citations: 17,
        linkedPages: 7,
        sensitive: false,
        llmVisible: true,
        immutable: false,
        summary:
          "Draft synthesis that should be reviewed before becoming canonical.",
      },
      {
        id: `${project.id}-index-file`,
        name: "index.md",
        path: `${rootPath}/wiki/index.md`,
        kind: "log",
        type: "Markdown",
        status: "ready",
        updatedAt: project.updatedAt,
        size: "9 KB",
        citations: 0,
        linkedPages: 24,
        sensitive: false,
        llmVisible: true,
        immutable: false,
        summary:
          "Navigable catalog of pages, one-line summaries, and page metadata.",
      },
      {
        id: `${project.id}-log-file`,
        name: "log.md",
        path: `${rootPath}/wiki/log.md`,
        kind: "log",
        type: "Markdown",
        status: "ready",
        updatedAt: "09:18",
        size: "22 KB",
        citations: 0,
        linkedPages: 0,
        sensitive: false,
        llmVisible: true,
        immutable: true,
        summary: "Chronological ingest, query, lint, and approval trail.",
      },
      {
        id: `${project.id}-schema`,
        name: "AGENTS.md",
        path: `${rootPath}/AGENTS.md`,
        kind: "schema",
        type: "Config",
        status: "approved",
        updatedAt: "2026-04-20",
        size: "7 KB",
        citations: 0,
        linkedPages: 3,
        sensitive: false,
        llmVisible: true,
        immutable: false,
        summary:
          "Project-specific wiki shape, conventions, workflows, and review rules.",
      },
      {
        id: `${project.id}-attachment`,
        name: "diagram-evidence-flow.png",
        path: `${rootPath}/raw/assets/diagram-evidence-flow.png`,
        kind: "asset",
        type: "Image",
        status: "ready",
        updatedAt: "2026-04-22",
        size: "780 KB",
        citations: 3,
        linkedPages: 2,
        sensitive: false,
        llmVisible: true,
        immutable: true,
        summary: "Local image attachment referenced by the evidence matrix.",
      },
      {
        id: `${project.id}-private`,
        name: "private-review-notes.md",
        path: `${rootPath}/raw/restricted/private-review-notes.md`,
        kind: "raw",
        type: "Markdown",
        status: "blocked",
        updatedAt: "2026-04-19",
        size: "6 KB",
        citations: 0,
        linkedPages: 0,
        sensitive: true,
        llmVisible: false,
        immutable: true,
        summary: "Restricted notes excluded from agent context by default.",
      },
    ],
  };
}

function makeTimeline(project: Project): ProjectTimelineItem[] {
  return [
    {
      label: "Discovery complete",
      time: "2026-04-18",
      state: "done",
    },
    {
      label: `${project.tasks} tasks triaged`,
      time: "2026-04-21",
      state: "done",
    },
    {
      label: "Reviewer pass",
      time: project.updatedAt,
      state: "current",
    },
    {
      label: "Delivery packet",
      time: "Queued",
      state: "queued",
    },
  ];
}

function makeGitState(project: Project): ProjectGitState {
  const paddedId = String(project.id).padStart(3, "0");

  return {
    baseBranch: "main",
    ahead: 2 + (project.id % 3),
    behind: project.id % 2,
    commitMessage: `Prepare ${project.name} handoff`,
    changes: [
      {
        id: `${project.id}-detail-page`,
        path: "apps/shell/src/pages/project-detail-page.tsx",
        status: "modified",
        additions: 34,
        deletions: 8,
        summary: "Wire project detail layout actions into the right panel",
        diff: `import { PanelRightOpenIcon } from "lucide-react";

type ProjectDetailPageProps = {
  projectId: number;
  onBack: () => void;
};

export function ProjectDetailPage({ projectId, onBack }: ProjectDetailPageProps) {
  const detail = getProjectDetail(projectId);
+ const [isInspectorOpen, setIsInspectorOpen] = React.useState(true);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
+       <Button
+         variant="ghost"
+         size="icon-sm"
+         onClick={() => setIsInspectorOpen((open) => !open)}
+       >
+         <PanelRightOpenIcon />
+       </Button>
      </main>
    </div>
  );
}`,
      },
      {
        id: `${project.id}-review-notes`,
        path: `docs/projects/${paddedId}/review-notes.md`,
        status: "added",
        additions: 42,
        deletions: 0,
        summary: "Add reviewer handoff notes and pending evidence list",
        diff: `# ${project.name} reviewer notes

+ Owner: ${project.owner}
+ Priority: ${project.priority}
+ Status: ${project.status}

## Handoff

+ Confirm the latest evidence matrix before the proposal pass.
+ Keep reviewer comments grouped by risk and owner.
+ Attach source documents before marking delivery ready.`,
      },
      {
        id: `${project.id}-workspace-config`,
        path: "apps/shell/src/data/project-detail.ts",
        status: "modified",
        additions: 18,
        deletions: 4,
        summary: "Expose git metadata in project detail data",
        diff: `export type ProjectGitState = {
  baseBranch: string;
  ahead: number;
  behind: number;
  changes: ProjectGitChange[];
};

export function getProjectDetail(projectId: number): ProjectDetail | null {
  return {
    branch: "project/${paddedId}-handoff",
+   git: makeGitState(project),
  };
}`,
      },
    ],
  };
}

function makeBrowserState(project: Project): ProjectBrowserState {
  const projectRoot = getProjectRoot(project).replace(/\\/g, "/");
  const paddedId = String(project.id).padStart(3, "0");
  const baseProfilePath = `${projectRoot}/.fptclaw/browser-profiles`;

  return {
    defaultProviderId: "camoufox",
    providers: [
      {
        id: "camoufox",
        name: "Camoufox",
        engine: "Firefox anti-detect",
        transport: "Playwright / Juggler",
        status: "ready",
        setupCommand: "pip install -U camoufox[geoip] && camoufox fetch",
        description:
          "Fingerprint-rotating browser for headed, persistent local sessions.",
        capabilities: [
          "Persistent contexts",
          "Fingerprint rotation",
          "GeoIP alignment",
          "Humanized cursor",
        ],
        constraints: [
          "Python runtime required",
          "Use proxy, locale, timezone, and WebRTC as one lane",
        ],
      },
      {
        id: "chrome-cdp",
        name: "Chrome CDP",
        engine: "Chrome",
        transport: "Chrome DevTools Protocol",
        status: "planned",
        setupCommand:
          "chrome --remote-debugging-port=9222 --user-data-dir=<profile>",
        description:
          "Raw CDP provider for Browser Harness helpers and live Chrome sessions.",
        capabilities: [
          "One websocket",
          "Real cookies",
          "Agent-owned helpers",
          "Domain skills",
        ],
        constraints: [
          "Needs dedicated user-data-dir",
          "Port must be started before harness attach",
        ],
      },
    ],
    profiles: [
      {
        id: `${project.id}-camoufox-research`,
        name: "Research lane",
        providerId: "camoufox",
        status: "ready",
        profilePath: `${baseProfilePath}/camoufox/research-${paddedId}`,
        proxyLane: "Residential US",
        locale: "en-US",
        timezone: "America/New_York",
        os: "windows",
        headless: "headed",
        persistentContext: true,
        harnessMode: "playwright",
        endpoint: "local Playwright context",
        lastUsed: "Today 09:41",
        health: 92,
        cookieJar: "Warm login cookies",
        targetDomains: ["github.com", "docs.github.com"],
        tags: ["Hermes", "browser-harness", "safe-login"],
        notes:
          "Primary profile for logged-in research flows and account-bound browsing.",
      },
      {
        id: `${project.id}-camoufox-crm`,
        name: "CRM operator",
        providerId: "camoufox",
        status: "running",
        profilePath: `${baseProfilePath}/camoufox/crm-${paddedId}`,
        proxyLane: "Static ISP US",
        locale: "en-US",
        timezone: "America/Chicago",
        os: "windows",
        headless: "headed",
        persistentContext: true,
        harnessMode: "playwright",
        endpoint: "local Playwright context",
        lastUsed: "12 min ago",
        health: 88,
        cookieJar: "CRM + SSO cookies",
        targetDomains: ["linkedin.com", "hubspot.com"],
        tags: ["domain-skill", "crm", "humanized"],
        notes:
          "Dedicated account lane for repetitive CRM tasks with stable proxy identity.",
      },
      {
        id: `${project.id}-camoufox-marketplace`,
        name: "Marketplace checkout",
        providerId: "camoufox",
        status: "warming",
        profilePath: `${baseProfilePath}/camoufox/marketplace-${paddedId}`,
        proxyLane: "Residential EU",
        locale: "en-GB",
        timezone: "Europe/London",
        os: "macos",
        headless: "headed",
        persistentContext: true,
        harnessMode: "playwright",
        endpoint: "local Playwright context",
        lastUsed: "Yesterday",
        health: 81,
        cookieJar: "Clean warmup cookies",
        targetDomains: ["amazon.com", "stripe.com"],
        tags: ["checkout", "proxy-lane", "warmup"],
        notes:
          "Profile kept separate because marketplace flows are sensitive to identity drift.",
      },
    ],
    harness: {
      agent: "Hermes Agent",
      outcome: "Local AGI",
      skillRoot: `${projectRoot}/.fptclaw/browser-skills`,
      helperPolicy:
        "Agent may extend helpers only inside project harness scope",
      domainSkills: 7 + (project.id % 5),
      cdpUrl: null,
      notes: [
        "Camoufox profiles use persistent_context with user_data_dir.",
        "Chrome CDP profiles will expose ws://localhost:<port> endpoints for raw Browser Harness.",
        "Keep proxy, locale, timezone, and WebRTC aligned per profile lane.",
      ],
    },
  };
}

export function getProjectDetail(
  projectId: number,
  projectList: Project[] = projects,
): ProjectDetail | null {
  const project = projectList.find((item) => item.id === projectId);

  if (!project) {
    return null;
  }

  return {
    project,
    activeTask: `Prepare ${project.name} for reviewer handoff`,
    branch: `project/${String(project.id).padStart(3, "0")}-handoff`,
    contextUsed: 32 + ((project.id * 7) % 55),
    contextLimit: 100,
    environment: pick(environments, project.id),
    model: pick(modelNames, project.id),
    mode: project.status === "Discovery" ? "Plan" : "Act",
    messages: makeMessages(project),
    resources: makeResources(project),
    wiki: makeWikiState(project),
    files: makeFileState(project),
    timeline: makeTimeline(project),
    git: makeGitState(project),
    browser: makeBrowserState(project),
  };
}
