// Stub implementation: full module is ant-only and dynamically loaded by
// REPL.tsx via require() when ("external" === "ant"). For external builds
// the conditional fallback is used instead. The signature here exists so
// callers in REPL.tsx type-check correctly; the actual hook lives behind
// the dynamic import.

export type FrustrationDetectionState = {
  state: "open" | "closed" | string;
  handleTranscriptSelect: () => void;
};

export function useFrustrationDetection(
  _messages: readonly unknown[],
  _isLoading: boolean,
  _hasActivePrompt: boolean,
  _otherSurveyOpen: boolean,
): FrustrationDetectionState {
  return {
    state: "closed",
    handleTranscriptSelect: () => {},
  };
}
