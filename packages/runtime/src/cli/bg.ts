// Stub: cli background runner. Disabled in external builds.

function notAvailable(): never {
  throw new Error("cli bg is not available in this build");
}

export async function psHandler(_args: readonly string[]): Promise<void> {
  notAvailable();
}

export async function logsHandler(_id?: string): Promise<void> {
  notAvailable();
}

export async function attachHandler(_id?: string): Promise<void> {
  notAvailable();
}

export async function killHandler(_id?: string): Promise<void> {
  notAvailable();
}

export async function handleBgFlag(_args: readonly string[]): Promise<void> {
  notAvailable();
}

const stub = {
  psHandler,
  logsHandler,
  attachHandler,
  killHandler,
  handleBgFlag,
};
export default stub;
