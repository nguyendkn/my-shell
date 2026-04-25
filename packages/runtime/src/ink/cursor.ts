export function hideCursor(): string {
  return "";
}

export function showCursor(): string {
  return "";
}

export type Cursor = {
  x: number;
  y: number;
  visible?: boolean;
};
