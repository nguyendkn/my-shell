import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  CreateProjectBrowserProfileParams,
  LaunchProjectBrowserProfileResult,
  LoadProjectBrowserProfilesResult,
  ProjectBrowserProfile,
  ProjectBrowserProfileParams,
  ProjectBrowserProfileOperationParams,
  ProjectBrowserProfileResult,
  ProjectBrowserProviderId,
} from "./browser-profiles-types";
import { traceRuntimeBridge } from "./runtime-paths";

type RegistryFile = {
  version: 1;
  profiles: ProjectBrowserProfile[];
};

const EMPTY_REGISTRY: RegistryFile = {
  version: 1,
  profiles: [],
};

function isDirectory(value: string) {
  try {
    return statSync(value).isDirectory();
  } catch {
    return false;
  }
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "profile"
  );
}

function resolveProjectFolder(cwd?: string) {
  const value = cwd?.trim();

  if (!value || !isDirectory(value)) {
    return null;
  }

  return value;
}

function getStorage(projectFolder: string) {
  const root = path.join(projectFolder, ".fptclaw", "browser-profiles");

  return {
    root,
    registryPath: path.join(root, "profiles.json"),
  };
}

async function ensureRegistry(projectFolder: string) {
  const storage = getStorage(projectFolder);

  await mkdir(storage.root, { recursive: true });

  if (!existsSync(storage.registryPath)) {
    await writeFile(
      storage.registryPath,
      JSON.stringify(EMPTY_REGISTRY, null, 2),
      "utf8",
    );
  }

  return storage;
}

function normalizeProfile(profile: ProjectBrowserProfile): ProjectBrowserProfile {
  return {
    ...profile,
    targetDomains: Array.isArray(profile.targetDomains)
      ? profile.targetDomains
      : [],
    tags: Array.isArray(profile.tags) ? profile.tags : [],
  };
}

async function readRegistry(projectFolder: string): Promise<{
  storagePath: string;
  profiles: ProjectBrowserProfile[];
}> {
  const storage = await ensureRegistry(projectFolder);
  const raw = await readFile(storage.registryPath, "utf8");
  const parsed = JSON.parse(raw) as RegistryFile;

  return {
    storagePath: storage.registryPath,
    profiles: Array.isArray(parsed.profiles)
      ? parsed.profiles.map(normalizeProfile)
      : [],
  };
}

async function writeRegistry(
  projectFolder: string,
  profiles: ProjectBrowserProfile[],
) {
  const storage = await ensureRegistry(projectFolder);

  await writeFile(
    storage.registryPath,
    JSON.stringify({ version: 1, profiles }, null, 2),
    "utf8",
  );

  return storage.registryPath;
}

function getDefaultProfileName(providerId: ProjectBrowserProviderId, index: number) {
  if (providerId === "camoufox") {
    return `Camoufox lane ${String(index).padStart(2, "0")}`;
  }

  return `Chrome CDP lane ${String(index).padStart(2, "0")}`;
}

function getDefaultProfilePath(
  projectFolder: string,
  providerId: ProjectBrowserProviderId,
  name: string,
  id: string,
) {
  return path.join(projectFolder, ".fptclaw", "browser-profiles", providerId, `${slugify(name)}-${id.slice(0, 8)}`);
}

function createProfileRecord(
  params: CreateProjectBrowserProfileParams,
  projectFolder: string,
  index: number,
): ProjectBrowserProfile {
  const id = crypto.randomUUID();
  const name = params.name?.trim() || getDefaultProfileName(params.providerId, index);
  const isCamoufox = params.providerId === "camoufox";

  return {
    id,
    name,
    providerId: params.providerId,
    status: "needs-setup",
    profilePath: getDefaultProfilePath(projectFolder, params.providerId, name, id),
    proxyLane: "Unassigned",
    locale: "en-US",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    os: process.platform === "darwin" ? "macos" : process.platform === "win32" ? "windows" : "linux",
    headless: "headed",
    persistentContext: true,
    harnessMode: isCamoufox ? "playwright" : "cdp",
    endpoint: isCamoufox ? "local Playwright context" : "Not attached",
    lastUsed: "Never",
    health: 35,
    cookieJar: "Empty",
    targetDomains: [],
    tags: [params.providerId, "project-local"],
    notes: "Created from the native browser profile manager.",
  };
}

function mergeProfile(
  profiles: ProjectBrowserProfile[],
  nextProfile: ProjectBrowserProfile,
) {
  const index = profiles.findIndex((profile) => profile.id === nextProfile.id);

  if (index === -1) {
    return [nextProfile, ...profiles];
  }

  const copy = [...profiles];
  copy[index] = nextProfile;

  return copy;
}

async function upsertProfile(
  projectFolder: string,
  profile: ProjectBrowserProfile,
) {
  const registry = await readRegistry(projectFolder);
  const profiles = mergeProfile(registry.profiles, profile);
  const storagePath = await writeRegistry(projectFolder, profiles);

  return { storagePath, profiles };
}

function resolveProfileFolder(profile: ProjectBrowserProfile) {
  return profile.profilePath;
}

async function writeProfileMetadata(profile: ProjectBrowserProfile) {
  await mkdir(resolveProfileFolder(profile), { recursive: true });
  await writeFile(
    path.join(resolveProfileFolder(profile), "profile.json"),
    JSON.stringify(profile, null, 2),
    "utf8",
  );
}

function calculateHealth(profile: ProjectBrowserProfile) {
  let health = 35;

  if (existsSync(resolveProfileFolder(profile))) health += 30;
  if (existsSync(path.join(resolveProfileFolder(profile), "profile.json"))) {
    health += 15;
  }
  if (existsSync(path.join(resolveProfileFolder(profile), "warmup.json"))) {
    health += 10;
  }
  if (profile.proxyLane !== "Unassigned") health += 10;

  return Math.min(100, health);
}

async function runCommand(args: string[], cwd: string, timeoutMs = 3_000) {
  const child = Bun.spawn(args, {
    cwd,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    windowsHide: true,
  });
  const timeout = setTimeout(() => child.kill(), timeoutMs);

  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);

    return { stdout, stderr, exitCode };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkLaunchCommand(
  profile: ProjectBrowserProfile,
  projectFolder: string,
) {
  if (profile.providerId === "camoufox") {
    const result = await runCommand(
      ["python", "-c", "import camoufox; print('camoufox-ok')"],
      projectFolder,
    );

    return result.exitCode === 0
      ? {
          ok: true,
          command: ["python", "-m", "camoufox"],
        }
      : {
          ok: false,
          command: ["python", "-m", "camoufox"],
          error:
            "Camoufox Python package is not installed for this workspace.",
        };
  }

  const edgePath = path.join(
    process.env.ProgramFiles ?? "C:\\Program Files",
    "Microsoft",
    "Edge",
    "Application",
    "msedge.exe",
  );

  return existsSync(edgePath)
    ? {
        ok: true,
        command: [
          edgePath,
          "--remote-debugging-port=9222",
          `--user-data-dir=${profile.profilePath}`,
        ],
      }
    : {
        ok: false,
        command: ["msedge", "--remote-debugging-port=9222"],
        error: "Microsoft Edge executable was not found.",
      };
}

export async function loadProjectBrowserProfiles({
  cwd,
}: ProjectBrowserProfileParams): Promise<LoadProjectBrowserProfilesResult> {
  const projectFolder = resolveProjectFolder(cwd);

  if (!projectFolder) {
    return {
      available: false,
      storagePath: null,
      profiles: [],
      error: "Project folder is unavailable.",
    };
  }

  const registry = await readRegistry(projectFolder);

  return {
    available: true,
    storagePath: registry.storagePath,
    profiles: registry.profiles,
  };
}

export async function createProjectBrowserProfile(
  params: CreateProjectBrowserProfileParams,
): Promise<ProjectBrowserProfileResult> {
  const projectFolder = resolveProjectFolder(params.cwd);

  if (!projectFolder) {
    return {
      ok: false,
      storagePath: null,
      error: "Project folder is unavailable.",
    };
  }

  const registry = await readRegistry(projectFolder);
  const profile = createProfileRecord(params, projectFolder, registry.profiles.length + 1);

  await writeProfileMetadata(profile);
  const { storagePath } = await upsertProfile(projectFolder, profile);

  traceRuntimeBridge("browser_profile.create", {
    projectId: params.projectId,
    providerId: params.providerId,
    profileId: profile.id,
    profilePath: profile.profilePath,
  });

  return {
    ok: true,
    storagePath,
    profile,
    message: "Profile storage created.",
  };
}

export async function verifyProjectBrowserProfile(
  params: ProjectBrowserProfileOperationParams,
): Promise<ProjectBrowserProfileResult> {
  const projectFolder = resolveProjectFolder(params.cwd);

  if (!projectFolder) {
    traceRuntimeBridge("browser_profile.verify", {
      projectId: params.projectId,
      profileId: params.profile.id,
      ok: false,
      error: "Project folder is unavailable.",
    });

    return {
      ok: false,
      storagePath: null,
      error: "Project folder is unavailable.",
    };
  }

  await mkdir(resolveProfileFolder(params.profile), { recursive: true });
  await writeProfileMetadata(params.profile);

  const health = calculateHealth(params.profile);
  const profile: ProjectBrowserProfile = {
    ...params.profile,
    health,
    status: health >= 75 ? "ready" : "needs-setup",
    cookieJar: existsSync(path.join(resolveProfileFolder(params.profile), "warmup.json"))
      ? "Preparation metadata present"
      : params.profile.cookieJar,
    notes:
      health >= 75
        ? "Profile storage verified by native filesystem checks."
        : "Profile storage exists, but identity warmup is still incomplete.",
  };
  const { storagePath } = await upsertProfile(projectFolder, profile);

  traceRuntimeBridge("browser_profile.verify", {
    projectId: params.projectId,
    profileId: profile.id,
    ok: true,
    status: profile.status,
    health: profile.health,
    storagePath,
  });

  return {
    ok: true,
    storagePath,
    profile,
    message: "Profile verified.",
  };
}

export async function warmProjectBrowserProfile(
  params: ProjectBrowserProfileOperationParams,
): Promise<ProjectBrowserProfileResult> {
  const projectFolder = resolveProjectFolder(params.cwd);

  if (!projectFolder) {
    traceRuntimeBridge("browser_profile.prepare", {
      projectId: params.projectId,
      profileId: params.profile.id,
      ok: false,
      error: "Project folder is unavailable.",
    });

    return {
      ok: false,
      storagePath: null,
      error: "Project folder is unavailable.",
    };
  }

  const warmedAt = new Date().toISOString();

  await mkdir(resolveProfileFolder(params.profile), { recursive: true });
  await writeFile(
    path.join(resolveProfileFolder(params.profile), "warmup.json"),
    JSON.stringify({ warmedAt, providerId: params.profile.providerId }, null, 2),
    "utf8",
  );

  const profile: ProjectBrowserProfile = {
    ...params.profile,
    status: "ready",
    health: Math.max(params.profile.health, 90),
    cookieJar: "Preparation metadata present",
    lastUsed: warmedAt,
    notes: "Profile preparation metadata was written by the native manager.",
  };

  await writeProfileMetadata(profile);
  const { storagePath } = await upsertProfile(projectFolder, profile);

  traceRuntimeBridge("browser_profile.prepare", {
    projectId: params.projectId,
    profileId: profile.id,
    ok: true,
    status: profile.status,
    health: profile.health,
    storagePath,
  });

  return {
    ok: true,
    storagePath,
    profile,
    message: "Profile storage prepared.",
  };
}

export async function launchProjectBrowserProfile(
  params: ProjectBrowserProfileOperationParams,
): Promise<LaunchProjectBrowserProfileResult> {
  const projectFolder = resolveProjectFolder(params.cwd);

  if (!projectFolder) {
    traceRuntimeBridge("browser_profile.launch_check", {
      projectId: params.projectId,
      profileId: params.profile.id,
      ok: false,
      launched: false,
      error: "Project folder is unavailable.",
    });

    return {
      ok: false,
      launched: false,
      storagePath: null,
      error: "Project folder is unavailable.",
    };
  }

  const launchCheck = await checkLaunchCommand(params.profile, projectFolder);

  if (!launchCheck.ok) {
    const profile: ProjectBrowserProfile = {
      ...params.profile,
      status: "needs-setup",
      notes: launchCheck.error ?? "Browser provider is not available.",
    };
    const { storagePath } = await upsertProfile(projectFolder, profile);

    traceRuntimeBridge("browser_profile.launch_check", {
      projectId: params.projectId,
      profileId: profile.id,
      ok: false,
      launched: false,
      status: profile.status,
      command: launchCheck.command,
      error: launchCheck.error,
      storagePath,
    });

    return {
      ok: false,
      launched: false,
      storagePath,
      profile,
      command: launchCheck.command,
      error: launchCheck.error,
    };
  }

  const profile: ProjectBrowserProfile = {
    ...params.profile,
    status:
      params.profile.status === "needs-setup" ? "ready" : params.profile.status,
    lastUsed: new Date().toISOString(),
    notes:
      "Browser provider launch prerequisites are available. No browser process was started by this check.",
  };
  const { storagePath } = await upsertProfile(projectFolder, profile);

  traceRuntimeBridge("browser_profile.launch_check", {
    projectId: params.projectId,
    profileId: profile.id,
    ok: true,
    launched: false,
    status: profile.status,
    command: launchCheck.command,
    storagePath,
  });

  return {
    ok: true,
    launched: false,
    storagePath,
    profile,
    command: launchCheck.command,
    message: "Browser provider launch prerequisites verified.",
  };
}
