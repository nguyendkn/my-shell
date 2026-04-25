import * as React from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  Clock3Icon,
  CookieIcon,
  DatabaseIcon,
  FingerprintIcon,
  GlobeIcon,
  HardDriveIcon,
  Layers3Icon,
  NetworkIcon,
  PlayIcon,
  SearchIcon,
  ServerIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  UserRoundCheckIcon,
  WifiIcon,
} from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@repo/ui/components/native-select";
import { Progress } from "@repo/ui/components/progress";
import { cn } from "@repo/ui/lib/utils";
import type {
  ProjectBrowserProfile,
  ProjectBrowserProfileStatus,
  ProjectBrowserProvider,
  ProjectBrowserProviderId,
  ProjectDetail,
} from "../../data/project-detail";

export type ProjectBrowserProfilesPanelHandle = {
  createProfile: () => void;
};

export type ProjectBrowserProfilesPanelProps = {
  detail: ProjectDetail;
};

type ProviderFilter = "all" | ProjectBrowserProviderId;
type ProfileStatusFilter = "all" | ProjectBrowserProfileStatus;

const statusLabel: Record<ProjectBrowserProfileStatus, string> = {
  ready: "Ready",
  warming: "Warming",
  running: "Running",
  "needs-setup": "Needs setup",
};
const statusFilters: Array<{
  value: ProfileStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "running", label: "Running" },
  { value: "ready", label: "Ready" },
  { value: "warming", label: "Warming" },
  { value: "needs-setup", label: "Needs setup" },
];

function getProjectRoot(detail: ProjectDetail) {
  return (
    detail.project.folderPath ??
    `projects/${String(detail.project.id).padStart(3, "0")}`
  ).replace(/\\/g, "/");
}

function getStatusClass(status: ProjectBrowserProfileStatus) {
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "running") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "warming") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-muted bg-muted text-muted-foreground";
}

function getProviderBadgeClass(provider: ProjectBrowserProvider) {
  return provider.status === "ready"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-muted bg-muted text-muted-foreground";
}

function getHealthClass(health: number) {
  if (health >= 90) {
    return "text-emerald-700";
  }

  if (health >= 75) {
    return "text-sky-700";
  }

  if (health >= 55) {
    return "text-amber-700";
  }

  return "text-destructive";
}

function getProfileSearchText(
  profile: ProjectBrowserProfile,
  provider?: ProjectBrowserProvider,
) {
  return [
    profile.name,
    provider?.name,
    profile.profilePath,
    profile.proxyLane,
    profile.locale,
    profile.timezone,
    profile.os,
    profile.cookieJar,
    profile.endpoint,
    ...profile.targetDomains,
    ...profile.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getProviderProfileCount(
  profiles: ProjectBrowserProfile[],
  providerId: ProjectBrowserProviderId,
) {
  return profiles.filter((profile) => profile.providerId === providerId).length;
}

function makeNewProfile(
  detail: ProjectDetail,
  index: number,
): ProjectBrowserProfile {
  const paddedProjectId = String(detail.project.id).padStart(3, "0");
  const paddedIndex = String(index).padStart(2, "0");

  return {
    id: `${detail.project.id}-camoufox-custom-${index}`,
    name: `Camoufox lane ${paddedIndex}`,
    providerId: "camoufox",
    status: "needs-setup",
    profilePath: `${getProjectRoot(
      detail,
    )}/.fptclaw/browser-profiles/camoufox/custom-${paddedProjectId}-${paddedIndex}`,
    proxyLane: "Unassigned",
    locale: "en-US",
    timezone: "America/New_York",
    os: "windows",
    headless: "headed",
    persistentContext: true,
    harnessMode: "playwright",
    endpoint: "local Playwright context",
    lastUsed: "Never",
    health: 42,
    cookieJar: "Empty",
    targetDomains: [],
    tags: ["new-profile", "camoufox"],
    notes: "New profile lane waiting for proxy, account, and warmup policy.",
  };
}

function getHarnessStackLabel(detail: ProjectDetail) {
  return `Browser Harness + ${detail.browser.harness.agent} = ${detail.browser.harness.outcome}`;
}

function BrowserProviderCard({
  provider,
  profileCount,
  isActive,
  onSelect,
}: {
  provider: ProjectBrowserProvider;
  profileCount: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const Icon = provider.id === "camoufox" ? FingerprintIcon : ServerIcon;

  return (
    <button
      type="button"
      className={cn(
        "min-w-0 rounded-md border bg-card p-3 text-left text-card-foreground transition-colors hover:bg-muted/50",
        isActive && "border-ring bg-muted/60",
      )}
      aria-pressed={isActive}
      onClick={onSelect}
      data-testid="project-browser-provider"
      data-provider-id={provider.id}
      data-profile-count={profileCount}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">
                {provider.name}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
                {provider.engine} · {provider.transport}
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant="outline" className={getProviderBadgeClass(provider)}>
            {provider.status === "ready" ? "Ready" : "Planned"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {profileCount} profiles
          </span>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
        {provider.description}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="min-w-0 rounded-md bg-muted/50 px-2 py-1.5">
          <div className="text-muted-foreground">Transport</div>
          <div className="truncate font-medium">{provider.transport}</div>
        </div>
        <div className="min-w-0 rounded-md bg-muted/50 px-2 py-1.5">
          <div className="text-muted-foreground">Engine</div>
          <div className="truncate font-medium">{provider.engine}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {provider.capabilities.slice(0, 3).map((capability) => (
          <Badge key={capability} variant="secondary">
            {capability}
          </Badge>
        ))}
      </div>
      <div className="mt-3 rounded-md bg-muted/50 px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
        {provider.setupCommand}
      </div>
    </button>
  );
}

function BrowserProfileRow({
  profile,
  provider,
  isSelected,
  onSelect,
}: {
  profile: ProjectBrowserProfile;
  provider: ProjectBrowserProvider;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-2 rounded-md border p-2 text-left transition-colors hover:bg-muted",
        isSelected && "border-ring bg-muted",
      )}
      onClick={onSelect}
      aria-pressed={isSelected}
      data-testid="project-browser-profile-row"
      data-profile-status={profile.status}
      data-provider-id={profile.providerId}
    >
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
        {profile.status === "running" ? (
          <PlayIcon className="size-4" />
        ) : (
          <FingerprintIcon className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium">{profile.name}</span>
          <Badge variant="outline" className={getStatusClass(profile.status)}>
            {statusLabel[profile.status]}
          </Badge>
        </span>
        <span className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto]">
          <span className="truncate">
            {provider.name} · {profile.proxyLane} · {profile.locale}
          </span>
          <span className={cn("font-medium", getHealthClass(profile.health))}>
            {profile.health}% health
          </span>
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-1">
          {profile.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground">
            {profile.targetDomains.length || "No"} domains
          </span>
        </span>
      </span>
    </button>
  );
}

function ProfileDataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 px-2.5 py-2 text-xs">
      <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <span className="min-w-0 truncate text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function ProfileDetail({
  profile,
  provider,
}: {
  profile: ProjectBrowserProfile;
  provider: ProjectBrowserProvider;
}) {
  const isIdentityReady = profile.proxyLane !== "Unassigned";

  return (
    <section
      className="flex min-h-0 flex-col overflow-hidden rounded-md border bg-card text-card-foreground"
      data-testid="project-browser-profile-detail"
    >
      <div className="shrink-0 border-b p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheckIcon className="size-4 text-muted-foreground" />
              <span className="truncate">{profile.name}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {provider.name} · {provider.transport}
            </p>
          </div>
          <Badge variant="outline" className={getStatusClass(profile.status)}>
            {statusLabel[profile.status]}
          </Badge>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <div className="min-w-0 rounded-md bg-muted/50 px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ActivityIcon className="size-3.5" />
              Health
            </div>
            <div
              className={cn(
                "mt-1 text-sm font-semibold",
                getHealthClass(profile.health),
              )}
            >
              {profile.health}%
            </div>
            <Progress value={profile.health} className="mt-1.5 h-1.5" />
          </div>
          <div className="min-w-0 rounded-md bg-muted/50 px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CookieIcon className="size-3.5" />
              Cookies
            </div>
            <div className="mt-1 truncate text-sm font-semibold">
              {profile.cookieJar}
            </div>
          </div>
          <div className="min-w-0 rounded-md bg-muted/50 px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3Icon className="size-3.5" />
              Last used
            </div>
            <div className="mt-1 truncate text-sm font-semibold">
              {profile.lastUsed}
            </div>
          </div>
          <div className="min-w-0 rounded-md bg-muted/50 px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isIdentityReady ? (
                <UserRoundCheckIcon className="size-3.5" />
              ) : (
                <AlertTriangleIcon className="size-3.5" />
              )}
              Identity
            </div>
            <div className="mt-1 truncate text-sm font-semibold">
              {isIdentityReady ? "Aligned" : "Needs setup"}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3 pb-4">
        <div className="grid gap-3 xl:grid-cols-2">
          <section className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <GlobeIcon className="size-3.5" />
              Identity lane
            </div>
            <div className="mt-2 divide-y rounded-md border bg-background">
              <ProfileDataRow
                icon={NetworkIcon}
                label="Proxy lane"
                value={profile.proxyLane}
              />
              <ProfileDataRow
                icon={GlobeIcon}
                label="Locale"
                value={profile.locale}
              />
              <ProfileDataRow
                icon={Clock3Icon}
                label="Timezone"
                value={profile.timezone}
              />
              <ProfileDataRow
                icon={HardDriveIcon}
                label="OS fingerprint"
                value={<span className="capitalize">{profile.os}</span>}
              />
            </div>
          </section>

          <section className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <WifiIcon className="size-3.5" />
              Harness attach
            </div>
            <div className="mt-2 divide-y rounded-md border bg-background">
              <ProfileDataRow
                icon={SlidersHorizontalIcon}
                label="Mode"
                value={
                  <span className="capitalize">{profile.harnessMode}</span>
                }
              />
              <ProfileDataRow
                icon={PlayIcon}
                label="Runtime"
                value={<span className="capitalize">{profile.headless}</span>}
              />
              <ProfileDataRow
                icon={DatabaseIcon}
                label="Persistent context"
                value={profile.persistentContext ? "Enabled" : "Off"}
              />
              <ProfileDataRow
                icon={WifiIcon}
                label="Endpoint"
                value={profile.endpoint}
              />
            </div>
          </section>
        </div>

        <section className="mt-3 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
            <DatabaseIcon className="size-3.5" />
            Profile storage
          </div>
          <div className="mt-2 rounded-md border bg-background p-2">
            <div className="break-all font-mono text-[11px] text-muted-foreground">
              {profile.profilePath}
            </div>
          </div>
        </section>

        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <Layers3Icon className="size-3.5" />
              Target domains
            </div>
            <div className="mt-2 flex flex-wrap gap-1 rounded-md border bg-background p-2">
              {profile.targetDomains.length > 0 ? (
                profile.targetDomains.map((domain) => (
                  <Badge key={domain} variant="outline">
                    {domain}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">No domains assigned</Badge>
              )}
            </div>
          </section>
          <section className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <SparklesIcon className="size-3.5" />
              Notes
            </div>
            <p className="mt-2 rounded-md border bg-background p-2 text-sm text-muted-foreground">
              {profile.notes}
            </p>
          </section>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-t bg-muted/20 p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="project-browser-profile-verify"
        >
          <CheckCircle2Icon />
          Verify setup
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="project-browser-profile-launch"
        >
          <PlayIcon />
          Launch headed
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="project-browser-profile-warm"
        >
          <Clock3Icon />
          Warm profile
        </Button>
      </div>
    </section>
  );
}

export const ProjectBrowserProfilesPanel = React.forwardRef<
  ProjectBrowserProfilesPanelHandle,
  ProjectBrowserProfilesPanelProps
>(function ProjectBrowserProfilesPanel({ detail }, ref) {
  const [profiles, setProfiles] = React.useState(detail.browser.profiles);
  const [query, setQuery] = React.useState("");
  const [providerFilter, setProviderFilter] =
    React.useState<ProviderFilter>("all");
  const [statusFilter, setStatusFilter] =
    React.useState<ProfileStatusFilter>("all");
  const [selectedProfileId, setSelectedProfileId] = React.useState(
    detail.browser.profiles[0]?.id ?? "",
  );

  React.useEffect(() => {
    setProfiles(detail.browser.profiles);
    setQuery("");
    setProviderFilter("all");
    setStatusFilter("all");
    setSelectedProfileId(detail.browser.profiles[0]?.id ?? "");
  }, [detail]);

  const providerById = React.useMemo(() => {
    return new Map(
      detail.browser.providers.map((provider) => [provider.id, provider]),
    );
  }, [detail.browser.providers]);

  const filteredProfiles = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return profiles.filter((profile) => {
      const provider = providerById.get(profile.providerId);
      const matchesProvider =
        providerFilter === "all" || profile.providerId === providerFilter;
      const matchesStatus =
        statusFilter === "all" || profile.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        getProfileSearchText(profile, provider).includes(normalizedQuery);

      return matchesProvider && matchesStatus && matchesQuery;
    });
  }, [profiles, providerById, providerFilter, query, statusFilter]);

  const providerProfileCounts = React.useMemo(() => {
    return new Map(
      detail.browser.providers.map((provider) => [
        provider.id,
        getProviderProfileCount(profiles, provider.id),
      ]),
    );
  }, [detail.browser.providers, profiles]);

  React.useEffect(() => {
    if (!filteredProfiles.some((profile) => profile.id === selectedProfileId)) {
      setSelectedProfileId(filteredProfiles[0]?.id ?? "");
    }
  }, [filteredProfiles, selectedProfileId]);

  const selectedProfile =
    filteredProfiles.find((profile) => profile.id === selectedProfileId) ??
    filteredProfiles[0];
  const selectedProvider = selectedProfile
    ? providerById.get(selectedProfile.providerId)
    : undefined;

  const createProfile = React.useCallback(() => {
    setProfiles((currentProfiles) => {
      const nextProfile = makeNewProfile(detail, currentProfiles.length + 1);

      setSelectedProfileId(nextProfile.id);
      setProviderFilter("all");
      setStatusFilter("all");
      setQuery("");

      return [nextProfile, ...currentProfiles];
    });
  }, [detail]);

  React.useImperativeHandle(
    ref,
    () => ({
      createProfile,
    }),
    [createProfile],
  );

  const readyProviderCount = detail.browser.providers.filter(
    (provider) => provider.status === "ready",
  ).length;
  const runningProfileCount = profiles.filter(
    (profile) => profile.status === "running",
  ).length;
  const harnessStackLabel = getHarnessStackLabel(detail);

  return (
    <section
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
      data-testid="project-browser-profiles-panel"
      data-profile-count={profiles.length}
    >
      <div className="shrink-0 border-b bg-muted/20 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className="flex items-center gap-2 text-sm font-semibold"
              data-testid="project-browser-harness-title"
            >
              <SparklesIcon className="size-4 text-muted-foreground" />
              {harnessStackLabel}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {detail.browser.harness.skillRoot}
            </p>
          </div>
          <div className="grid min-w-56 grid-cols-2 gap-2 sm:flex">
            <div
              className="rounded-md border bg-background px-2 py-1.5 text-xs"
              data-testid="project-browser-provider-ready-count"
            >
              <div className="text-muted-foreground">Providers</div>
              <div className="font-semibold">
                {readyProviderCount}/{detail.browser.providers.length} ready
              </div>
            </div>
            <div
              className="rounded-md border bg-background px-2 py-1.5 text-xs"
              data-testid="project-browser-profile-total"
            >
              <div className="text-muted-foreground">Profiles</div>
              <div className="font-semibold">{profiles.length} total</div>
            </div>
            <div
              className="rounded-md border bg-background px-2 py-1.5 text-xs"
              data-testid="project-browser-profile-running-count"
            >
              <div className="text-muted-foreground">Running</div>
              <div className="font-semibold">{runningProfileCount} active</div>
            </div>
            <div className="rounded-md border bg-background px-2 py-1.5 text-xs">
              <div className="text-muted-foreground">Skills</div>
              <div className="font-semibold">
                {detail.browser.harness.domainSkills} domain
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(17rem,1fr))]">
          {detail.browser.providers.map((provider) => (
            <BrowserProviderCard
              key={provider.id}
              provider={provider}
              profileCount={providerProfileCounts.get(provider.id) ?? 0}
              isActive={providerFilter === provider.id}
              onSelect={() =>
                setProviderFilter((currentProviderFilter) =>
                  currentProviderFilter === provider.id ? "all" : provider.id,
                )
              }
            />
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(16rem,42vh)_minmax(0,1fr)] gap-0 lg:grid-cols-[minmax(19rem,23rem)_minmax(0,1fr)] lg:grid-rows-none">
        <aside className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
          <div className="shrink-0 space-y-2 border-b p-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-7"
                placeholder="Search browser profiles"
                data-testid="project-browser-profile-search"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <NativeSelect
                value={providerFilter}
                onChange={(event) =>
                  setProviderFilter(event.target.value as ProviderFilter)
                }
                aria-label="Browser provider filter"
                data-testid="project-browser-provider-filter"
              >
                <NativeSelectOption value="all">
                  All providers
                </NativeSelectOption>
                {detail.browser.providers.map((provider) => (
                  <NativeSelectOption key={provider.id} value={provider.id}>
                    {provider.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ProfileStatusFilter)
                }
                aria-label="Browser profile status filter"
                data-testid="project-browser-status-filter"
              >
                {statusFilters.map((statusFilterOption) => (
                  <NativeSelectOption
                    key={statusFilterOption.value}
                    value={statusFilterOption.value}
                  >
                    {statusFilterOption.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-medium uppercase text-muted-foreground">
                Profiles
              </h3>
              <Badge variant="outline">
                {filteredProfiles.length}/{profiles.length}
              </Badge>
            </div>
            <div className="space-y-1.5">
              {filteredProfiles.length === 0 ? (
                <div
                  className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground"
                  data-testid="project-browser-profile-empty"
                >
                  No browser profiles match the current filter.
                </div>
              ) : (
                filteredProfiles.map((profile) => {
                  const provider = providerById.get(profile.providerId);

                  if (!provider) {
                    return null;
                  }

                  return (
                    <BrowserProfileRow
                      key={profile.id}
                      profile={profile}
                      provider={provider}
                      isSelected={selectedProfile?.id === profile.id}
                      onSelect={() => setSelectedProfileId(profile.id)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <main className="grid min-h-0 gap-3 p-3 lg:grid-rows-[minmax(0,1fr)_auto]">
          {selectedProfile && selectedProvider ? (
            <ProfileDetail
              profile={selectedProfile}
              provider={selectedProvider}
            />
          ) : (
            <section className="flex min-h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Select a browser profile.
            </section>
          )}

          <section
            className="rounded-md border bg-card p-3 text-card-foreground"
            data-testid="project-browser-harness-summary"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheckIcon className="size-4 text-muted-foreground" />
                  Harness readiness
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {harnessStackLabel}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                <Badge variant="outline">
                  {readyProviderCount} ready providers
                </Badge>
                <Badge variant="outline">
                  {runningProfileCount} running profiles
                </Badge>
                <Badge variant="outline">
                  {detail.browser.harness.domainSkills} domain skills
                </Badge>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
              <div className="min-w-0 rounded-md bg-muted/50 px-2 py-1.5">
                <div className="text-muted-foreground">Helper policy</div>
                <div className="mt-1 truncate font-medium">
                  {detail.browser.harness.helperPolicy}
                </div>
              </div>
              <div className="min-w-0 rounded-md bg-muted/50 px-2 py-1.5">
                <div className="text-muted-foreground">Skill root</div>
                <div className="mt-1 truncate font-medium">
                  {detail.browser.harness.skillRoot}
                </div>
              </div>
              <div className="min-w-0 rounded-md bg-muted/50 px-2 py-1.5">
                <div className="text-muted-foreground">CDP endpoint</div>
                <div className="mt-1 truncate font-medium">
                  {detail.browser.harness.cdpUrl ?? "Not attached"}
                </div>
              </div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {detail.browser.harness.notes.map((note) => (
                <div
                  key={note}
                  className="rounded-md bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground"
                >
                  {note}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </section>
  );
});
