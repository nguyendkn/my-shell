// Stub: assistant gate. Returns disabled in external builds.
const stub = {} as Record<string, unknown>;
export default stub;
export const isAssistantEnabled = (): boolean => false;
export const isKairosEnabled = async (): Promise<boolean> => false;
