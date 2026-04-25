// Stub: session data uploader (ant-only telemetry).
export async function uploadSessionData(_payload: unknown): Promise<void> {}

export interface SessionTurnUploader {
  readonly upload: (turn: unknown) => Promise<void>;
  readonly close: () => Promise<void>;
}

export function createSessionTurnUploader(): SessionTurnUploader {
  return {
    upload: async () => {},
    close: async () => {},
  };
}

export default { uploadSessionData, createSessionTurnUploader };
