import type { CustomAgentDefinition } from "../../../tools/AgentTool/loadAgentsDir.js";
import type { SettingSource } from "../../../utils/settings/constants.js";

// The accumulated wizard payload built up by NewAgentCreation steps. Step
// components read concrete fields (agentType, location, whenToUse, etc.) so
// these are typed up-front rather than left as `unknown` on a generic bag.
//
// `location` uses SettingSource (the project/user/local settings file kind)
// rather than the looser AgentMemoryScope alias, because that's what the
// downstream agent-write paths consume.
export type AgentWizardData = {
  agentType?: string;
  location?: SettingSource;
  selectedModel?: string;
  selectedTools?: string[];
  systemPrompt?: string;
  whenToUse?: string;
  generationPrompt?: string;
  wasGenerated?: boolean;
  isGenerating?: boolean;
  // Loose shape: GenerateStep stores the LLM-generated agent here as
  // returned from generateAgent (identifier/whenToUse/systemPrompt) before
  // ColorStep promotes it to a CustomAgentDefinition with the remaining
  // required fields filled in.
  generatedAgent?: Partial<Omit<CustomAgentDefinition, "location">> & {
    identifier?: string;
    whenToUse?: string;
    systemPrompt?: string;
  };
  selectedMemory?: SettingSource;
  selectedColor?: string;
  method?: string;
  finalAgent?: Omit<CustomAgentDefinition, "location"> & {
    getSystemPrompt?: () => string;
  };
};
