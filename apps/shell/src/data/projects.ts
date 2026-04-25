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

const projectNames = [
  "FPTClaw Workspace",
  "Proposal Automation",
  "Document Intelligence",
  "Client Portal",
  "Workflow Studio",
  "Capture Pipeline",
  "Review Console",
  "Data Library",
];

const owners = [
  "Eddie Lake",
  "Jamik Tashpulatov",
  "Maya Johnson",
  "Sarah Chen",
  "Raj Patel",
  "Leila Ahmadi",
];

const statuses: ProjectStatus[] = ["Discovery", "Active", "Review", "Paused"];
const priorities: ProjectPriority[] = ["Low", "Medium", "High"];

function pick<T>(items: T[], index: number) {
  return items[index % items.length] as T;
}

export const projects: Project[] = Array.from({ length: 1000 }, (_, index) => {
  const id = index + 1;
  const name = pick(projectNames, index);
  const status = pick(statuses, index);

  return {
    id,
    name: `${name} ${String(id).padStart(3, "0")}`,
    description:
      "Shared workspace for project planning, proposal sections, reviewers, and supporting documents.",
    owner: pick(owners, index),
    status,
    priority: pick(priorities, index + 1),
    progress: (index * 17) % 101,
    documents: 8 + ((index * 5) % 42),
    tasks: 12 + ((index * 7) % 64),
    updatedAt: `2026-04-${String(1 + (index % 24)).padStart(2, "0")}`,
  };
});
