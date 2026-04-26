export type ProjectStatus = "Discovery" | "Active" | "Review" | "Paused";
export type ProjectPriority = "Low" | "Medium" | "High";

export type Project = {
  id: number;
  name: string;
  description: string;
  owner: string;
  folderPath?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  documents: number;
  tasks: number;
  updatedAt: string;
};

const OWNERS = [
  "Anh Tran",
  "Linh Nguyen",
  "Minh Pham",
  "Hoa Le",
  "Khoa Vu",
  "Mira Sato",
  "Jonas Becker",
  "Priya Rao",
  "Diego Alvarez",
  "Sasha Kim",
];

const STATUSES: ProjectStatus[] = ["Discovery", "Active", "Review", "Paused"];
const PRIORITIES: ProjectPriority[] = ["Low", "Medium", "High"];
const NAME_LEFT = [
  "Hermes",
  "Atlas",
  "Orion",
  "Vega",
  "Lyra",
  "Nova",
  "Echo",
  "Forge",
  "Pulse",
  "Vertex",
  "Halo",
  "Quartz",
  "Onyx",
  "Crux",
  "Helio",
  "Drift",
  "Cinder",
  "Mantle",
  "Kestrel",
  "Pelican",
];
const NAME_RIGHT = [
  "Runtime",
  "Harness",
  "Bridge",
  "Pipeline",
  "Console",
  "Workbench",
  "Studio",
  "Engine",
  "Harbor",
  "Beacon",
  "Atlas",
  "Lab",
  "Loom",
  "Forge",
  "Garden",
  "Outpost",
  "Yard",
  "Dock",
  "Mesh",
  "Field",
];
const WORKSTREAMS = [
  "agent orchestration",
  "browser harness validation",
  "wiki ingestion",
  "knowledge curation",
  "settings governance",
  "runtime telemetry",
  "permission auditing",
  "context indexing",
  "git review automation",
  "CDP profile lanes",
];

const BASE_UPDATED_AT = new Date("2026-04-26T09:00:00.000Z");

function rng(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;

    return state / 0x100000000;
  };
}

function pick<T>(items: T[], random: () => number) {
  return items[Math.floor(random() * items.length)] as T;
}

function formatUpdatedAt(daysAgo: number) {
  const date = new Date(BASE_UPDATED_AT);

  date.setDate(date.getDate() - daysAgo);

  return date.toISOString().slice(0, 10);
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateProjects(): Project[] {
  const random = rng(1337);

  return Array.from({ length: 1000 }, (_, index) => {
    const id = index + 1;
    const left = pick(NAME_LEFT, random);
    const right = pick(NAME_RIGHT, random);
    const owner = pick(OWNERS, random);
    const status = pick(STATUSES, random);
    const priority = pick(PRIORITIES, random);
    const workstream = pick(WORKSTREAMS, random);

    return {
      id,
      name: `${left} ${right} ${String(id).padStart(3, "0")}`,
      description: `Workspace for ${workstream} and downstream operator review.`,
      owner,
      folderPath: `D:\\Projects\\${slug(left)}-${slug(right)}-${id}`,
      status,
      priority,
      progress: Math.floor(random() * 101),
      documents: Math.floor(random() * 240) + 4,
      tasks: Math.floor(random() * 48),
      updatedAt: formatUpdatedAt(Math.floor(random() * 60)),
    };
  });
}

export const projects: Project[] = generateProjects();
