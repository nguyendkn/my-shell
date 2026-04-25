import * as React from "react";
import {
  AlertTriangleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  EyeIcon,
  EyeOffIcon,
  FileTextIcon,
  FolderIcon,
  HistoryIcon,
  ImageIcon,
  LinkIcon,
  LockIcon,
  SearchIcon,
  Settings2Icon,
  UploadIcon,
} from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Separator } from "@repo/ui/components/separator";
import { Switch } from "@repo/ui/components/switch";
import { ToggleGroup, ToggleGroupItem } from "@repo/ui/components/toggle-group";
import { cn } from "@repo/ui/lib/utils";
import type {
  ProjectDetail,
  ProjectFileAsset,
  ProjectFileKind,
} from "../../data/project-detail";

type ProjectFilesPanelProps = {
  detail: ProjectDetail;
};

type FileFilter = "all" | ProjectFileKind;

const fileFilters: { value: FileFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "raw", label: "Raw" },
  { value: "wiki", label: "Wiki" },
  { value: "schema", label: "Schema" },
  { value: "log", label: "Log" },
  { value: "asset", label: "Assets" },
];

function getKindLabel(kind: ProjectFileKind) {
  if (kind === "raw") {
    return "Raw";
  }

  if (kind === "wiki") {
    return "Wiki";
  }

  if (kind === "schema") {
    return "Schema";
  }

  if (kind === "log") {
    return "Log";
  }

  return "Asset";
}

function FileIcon({ file }: { file: ProjectFileAsset }) {
  if (file.kind === "raw") {
    return <DatabaseIcon className="size-4" />;
  }

  if (file.kind === "wiki") {
    return <BookOpenIcon className="size-4" />;
  }

  if (file.kind === "schema") {
    return <Settings2Icon className="size-4" />;
  }

  if (file.kind === "log") {
    return <HistoryIcon className="size-4" />;
  }

  if (file.type === "Image") {
    return <ImageIcon className="size-4" />;
  }

  return <FileTextIcon className="size-4" />;
}

function getStatusClass(status: ProjectFileAsset["status"]) {
  if (status === "ready" || status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "needs-ingest") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "blocked") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function isFileFilter(value: string): value is FileFilter {
  return fileFilters.some((filter) => filter.value === value);
}

function getFileVisibility(
  file: ProjectFileAsset,
  visibleById: Record<string, boolean>,
) {
  return visibleById[file.id] ?? file.llmVisible;
}

export function ProjectFilesPanel({ detail }: ProjectFilesPanelProps) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<FileFilter>("all");
  const [selectedFileId, setSelectedFileId] = React.useState(
    detail.files.files[0]?.id ?? "",
  );
  const [visibleById, setVisibleById] = React.useState<Record<string, boolean>>(
    {},
  );

  React.useEffect(() => {
    setQuery("");
    setFilter("all");
    setSelectedFileId(detail.files.files[0]?.id ?? "");
    setVisibleById({});
  }, [detail]);

  const filteredFiles = detail.files.files.filter((file) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesFilter = filter === "all" || file.kind === filter;
    const matchesQuery =
      !normalizedQuery ||
      file.name.toLowerCase().includes(normalizedQuery) ||
      file.path.toLowerCase().includes(normalizedQuery) ||
      file.summary.toLowerCase().includes(normalizedQuery);

    return matchesFilter && matchesQuery;
  });

  React.useEffect(() => {
    if (!filteredFiles.some((file) => file.id === selectedFileId)) {
      setSelectedFileId(filteredFiles[0]?.id ?? "");
    }
  }, [filteredFiles, selectedFileId]);

  const selectedFile =
    filteredFiles.find((file) => file.id === selectedFileId) ??
    filteredFiles[0];

  function setFileVisibility(file: ProjectFileAsset, nextVisible: boolean) {
    setVisibleById((current) => ({ ...current, [file.id]: nextVisible }));
  }

  return (
    <div
      className="flex min-h-0 flex-col gap-4 p-4"
      data-testid="project-files-panel"
    >
      <section className="rounded-md border bg-card p-3 text-card-foreground">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <FolderIcon className="size-4 text-muted-foreground" />
              <span className="truncate">Project files</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {detail.files.inboxCount} inbox · {detail.files.reviewCount}{" "}
              review · {detail.files.storageUsed}
            </p>
          </div>
          <Button type="button" variant="outline" size="xs">
            <UploadIcon />
            Add source
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-7"
            placeholder="Search files"
            data-testid="project-file-search"
          />
        </div>
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => {
            if (isFileFilter(value)) {
              setFilter(value);
            }
          }}
          variant="outline"
          size="sm"
          spacing={1}
          className="flex w-full flex-wrap"
          aria-label="File type filter"
        >
          {fileFilters.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <section className="min-h-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-medium uppercase text-muted-foreground">
            Library
          </h3>
          <Badge variant="outline">{filteredFiles.length} files</Badge>
        </div>
        <div className="max-h-96 space-y-1.5 overflow-auto pr-1">
          {filteredFiles.length === 0 ? (
            <div
              className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground"
              data-testid="project-file-empty"
            >
              No files match the current filter.
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              const isVisible = getFileVisibility(file, visibleById);

              return (
                <button
                  key={file.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors hover:bg-muted",
                    isSelected && "border-ring bg-muted",
                  )}
                  onClick={() => setSelectedFileId(file.id)}
                  data-testid="project-file-row"
                >
                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                    <FileIcon file={file} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm font-medium">
                        {file.name}
                      </span>
                      {file.sensitive && (
                        <LockIcon className="size-3 shrink-0 text-rose-600" />
                      )}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {file.path}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">{getKindLabel(file.kind)}</Badge>
                      <Badge
                        variant="outline"
                        className={getStatusClass(file.status)}
                      >
                        {file.status}
                      </Badge>
                      {isVisible ? (
                        <EyeIcon className="size-3 text-muted-foreground" />
                      ) : (
                        <EyeOffIcon className="size-3 text-muted-foreground" />
                      )}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {selectedFile && (
        <>
          <Separator />
          <section className="rounded-md border p-3">
            <div className="flex items-start gap-2">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileIcon file={selectedFile} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {selectedFile.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {selectedFile.path}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={getStatusClass(selectedFile.status)}
                  >
                    {selectedFile.status}
                  </Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                  {selectedFile.summary}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Citations</div>
                <div className="mt-1 text-base font-semibold">
                  {selectedFile.citations}
                </div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Linked pages</div>
                <div className="mt-1 text-base font-semibold">
                  {selectedFile.linkedPages}
                </div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Size</div>
                <div className="mt-1 text-base font-semibold">
                  {selectedFile.size}
                </div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Updated</div>
                <div className="mt-1 truncate text-base font-semibold">
                  {selectedFile.updatedAt}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-md border p-2">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  {selectedFile.immutable ? (
                    <CheckCircle2Icon className="size-4 text-emerald-700" />
                  ) : (
                    <AlertTriangleIcon className="size-4 text-amber-700" />
                  )}
                  <span className="truncate">
                    {selectedFile.immutable ? "Immutable" : "Editable"}
                  </span>
                </span>
                <Badge variant="outline">{selectedFile.type}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border p-2">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  {getFileVisibility(selectedFile, visibleById) ? (
                    <EyeIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <EyeOffIcon className="size-4 text-muted-foreground" />
                  )}
                  <span className="truncate">LLM visible</span>
                </span>
                <Switch
                  size="sm"
                  checked={getFileVisibility(selectedFile, visibleById)}
                  onCheckedChange={(nextVisible) =>
                    setFileVisibility(selectedFile, nextVisible)
                  }
                  aria-label="Toggle LLM file visibility"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" size="sm">
                <LinkIcon />
                Link
              </Button>
              <Button type="button" variant="outline" size="sm">
                <FileTextIcon />
                Open
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  selectedFile.status === "blocked" ||
                  !getFileVisibility(selectedFile, visibleById)
                }
              >
                <UploadIcon />
                Ingest
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
