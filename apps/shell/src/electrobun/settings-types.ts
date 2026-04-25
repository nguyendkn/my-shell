export type RuntimeSettingsSourceId =
  | "userSettings"
  | "projectSettings"
  | "localSettings"
  | "policySettings";

export type RuntimeSettingsSource = {
  id: RuntimeSettingsSourceId;
  label: string;
  scope: string;
  path: string;
  editable: boolean;
  exists: boolean;
  schemaUrl: string;
};

export type RuntimeSettingsLoadParams = {
  sourceId?: RuntimeSettingsSourceId;
};

export type RuntimeSettingsLoadResult = {
  runtimeRoot: string;
  runtimeVersion: string | null;
  sourceId: RuntimeSettingsSourceId;
  sources: RuntimeSettingsSource[];
  content: string;
  schemaUrl: string;
  exists: boolean;
  updatedAt: string | null;
  error?: string;
};

export type RuntimeSettingsSaveParams = {
  sourceId: RuntimeSettingsSourceId;
  content: string;
};

export type RuntimeSettingsSaveResult = {
  ok: boolean;
  sourceId: RuntimeSettingsSourceId;
  content?: string;
  updatedAt?: string;
  error?: string;
};
