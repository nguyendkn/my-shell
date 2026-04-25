import * as React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class SentryErrorBoundary extends React.Component<Props, State> {
  // React 19 ships .d.ts that omits the implicit `state`/`props` declarations
  // in the runtime entry point this build resolves; declare them explicitly
  // so TS sees the inherited members on the class instance.
  declare props: Props;
  declare state: State;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}
