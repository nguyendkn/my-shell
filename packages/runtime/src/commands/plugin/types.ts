// Discriminated union for the plugin-settings dialog router. Each variant's
// `type` field is the screen identifier; extra fields carry navigation hints
// (e.g. preselected plugin / marketplace, action verb).

export type ViewState =
  | { type: "menu" }
  | { type: "help" }
  | { type: "validate"; path?: string }
  | {
      type: "browse-marketplace";
      targetMarketplace?: string;
      targetPlugin?: string;
    }
  | { type: "discover-plugins"; targetPlugin?: string }
  | {
      type: "manage-plugins";
      targetPlugin?: string;
      targetMarketplace?: string;
      action?: "uninstall" | "enable" | "disable";
      initialValue?: string;
    }
  | { type: "marketplace-list" }
  | { type: "marketplace-menu" }
  | { type: "add-marketplace"; initialValue?: string }
  | {
      type: "manage-marketplaces";
      targetMarketplace?: string;
      action?: "remove" | "update";
    };

export type PluginSettingsProps = Record<string, unknown>;
