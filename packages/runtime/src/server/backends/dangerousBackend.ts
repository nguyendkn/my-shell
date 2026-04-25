// Stub: DangerousBackend. Disabled in external builds.
import type { SessionBackend } from "../sessionManager.js";

export class DangerousBackend implements SessionBackend {
  readonly name = "dangerous";
  constructor() {
    throw new Error("DangerousBackend is not available in this build");
  }
}
