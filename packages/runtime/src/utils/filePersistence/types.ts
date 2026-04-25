export type TurnStartTime = number;
export const DEFAULT_UPLOAD_CONCURRENCY = 4;

// Subdirectory under the session folder where session-output files live.
// {cwd}/{sessionId}/outputs is the agreed layout for the file-persistence
// scan/upload path; mirrored by the BYOC download path so uploads and
// downloads use the same directory.
export const OUTPUTS_SUBDIR = "outputs";

// Hard cap on the number of files persistFiles will process per turn —
// anything above this short-circuits with a single failure entry rather
// than enqueueing N uploads. Picked to bound API/network cost; tweak with
// the limit_exceeded analytics counter.
export const FILE_COUNT_LIMIT = 100;

export type PersistedFile = {
  filename: string;
  file_id: string;
};

export type FailedPersistence = {
  filename: string;
  error: string;
};

export type FilesPersistedEventData = {
  files: PersistedFile[];
  failed: FailedPersistence[];
};

// UploadResult is defined in src/services/api/filesApi.ts as the return
// shape of uploadSessionFiles; importing it here would risk circular deps,
// and the only consumer of types.ts that needs it pulls it from the API
// module directly.
