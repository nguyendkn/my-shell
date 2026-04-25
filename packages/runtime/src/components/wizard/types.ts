import type * as React from "react";

export type WizardContextValue = {
  currentStep?: number;
  totalSteps?: number;
  next?: () => void;
  back?: () => void;
  goToStep?: (step: number) => void;
};

export type WizardProviderProps = {
  children?: React.ReactNode;
};

export type WizardStepComponent = React.ComponentType<{
  context?: WizardContextValue;
  onComplete?: () => void;
  onCancel?: () => void;
}>;
