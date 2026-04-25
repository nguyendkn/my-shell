// Stub for ant-only connect URL parser. Returns null in external builds.

export interface ConnectUrlInfo {
  readonly host: string;
  readonly port: number;
  readonly token?: string;
  readonly serverUrl: string;
  readonly authToken: string;
}

export function parseConnectUrl(_url: string): ConnectUrlInfo | null {
  return null;
}

export default parseConnectUrl;
