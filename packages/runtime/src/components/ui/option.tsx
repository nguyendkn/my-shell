// Stub Option type used by selection components. The original ant runtime
// exports a richer Option<T> generic; external builds need only the
// label/value shape that callers construct inline.
export interface Option {
  readonly label: string;
  readonly value: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

export function Option(): null {
  return null;
}
