// Transport surface used by remoteIO + the CCR clients. The concrete
// implementations (SSETransport, WebSocketTransport, HybridTransport) all
// share these methods; the interface lists the union of what callers use.
export interface Transport {
  connect?(): Promise<void>;
  close?(): void | Promise<void>;
  send?(data: string): Promise<void>;
  setOnData?(callback: (data: string) => void): void;
  setOnClose?(callback: (closeCode?: number) => void): void;
  write?(message: unknown): Promise<void>;
}
