import { useContext } from "react";
import type { WizardContextValue } from "./types.js";
import { WizardContext } from "./WizardProvider.js";

// Returns the current wizard context value. The wizardData payload is
// structurally typed by the consumer — the React-compiled provider
// builds it incrementally and TypeScript can't infer the final shape.
// Callers narrow via the type parameter (`useWizard<MyShape>()`).
type WizardContextWithData<T> = WizardContextValue & {
  readonly wizardData: T;
  readonly goNext?: () => void;
  readonly goBack?: () => void;
  readonly cancel?: () => void;
  readonly currentStepIndex?: number;
  readonly totalSteps?: number;
  readonly setWizardData?: (data: T) => void;
  readonly updateWizardData?: (updates: Partial<T>) => void;
  readonly title?: string;
  readonly showStepCounter?: boolean;
};

export function useWizard<T = Record<string, unknown>>(): WizardContextWithData<T> {
  const context = useContext(WizardContext) as WizardContextWithData<T> | null;
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
